import { useState, useEffect } from 'react';
import { Card, Text, Stack, Button, TextInput, PasswordInput, Divider, Title, Center } from '@mantine/core';
import { IconLogin, IconUserPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { auth } from '../api/client';
import { useStore } from '../store/useStore';
import TelegramLoginButton, { TelegramUser } from '../components/TelegramLoginButton';
import { config } from '../config';

// Telegram Web App integration
declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            photo_url?: string;
          };
        };
        ready: () => void;
        expand: () => void;
        close: () => void;
        setHeaderColor: (color: string) => void;
        setBackgroundColor: (color: string) => void;
        BackButton: {
          show: () => void;
          hide: () => void;
          onClick: (callback: () => void) => void;
          offClick: (callback: () => void) => void;
        };
      };
    };
  }
}

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ login: '', password: '', confirmPassword: '' });
  const [isInsideTelegramWebApp, setIsInsideTelegramWebApp] = useState(false);
  const { setUser, setTelegramPhoto } = useStore();
  const { t } = useTranslation();

  // Проверяем Telegram WebApp при монтировании и после загрузки скрипта
  useEffect(() => {
    const checkTelegramWebApp = () => {
      const tgWebApp = window.Telegram?.WebApp;
      const isInside = !!(tgWebApp && (
        (tgWebApp.initData && tgWebApp.initData.length > 0) ||
        tgWebApp.initDataUnsafe?.user?.id
      ));
      setIsInsideTelegramWebApp(isInside);
    };

    // Проверяем сразу
    checkTelegramWebApp();

    // И ещё раз через небольшую задержку (скрипт мог не успеть загрузиться)
    const timer = setTimeout(checkTelegramWebApp, 100);
    return () => clearTimeout(timer);
  }, []);

  // Виджет показываем только если НЕ внутри WebApp
  const hasTelegramWidget = !isInsideTelegramWebApp && !!config.TELEGRAM_BOT_NAME && config.TELEGRAM_BOT_AUTH_ENABLE === 'true';

  const handleLogin = async () => {
    if (!formData.login || !formData.password) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await auth.login(formData.login, formData.password);
      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);
      notifications.show({ title: t('common.success'), message: t('auth.loginSuccess'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.loginError'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!formData.login || !formData.password) {
      notifications.show({ title: t('common.error'), message: t('auth.fillAllFields'), color: 'red' });
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      notifications.show({ title: t('common.error'), message: t('auth.passwordsMismatch'), color: 'red' });
      return;
    }

    setLoading(true);
    try {
      await auth.register(formData.login, formData.password);
      notifications.show({ title: t('common.success'), message: t('auth.registerSuccess'), color: 'green' });
      // Переключаемся на авторизацию, сохраняя логин
      setMode('login');
      setFormData({ ...formData, confirmPassword: '' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.registerError'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      handleLogin();
    } else {
      handleRegister();
    }
  };

  // Авторизация через Telegram Login Widget
  const handleTelegramWidgetAuth = async (telegramUser: TelegramUser) => {
    setLoading(true);
    try {
      // Отправляем данные виджета на бэкенд
      await auth.telegramWidgetAuth(telegramUser);
      const userResponse = await auth.getCurrentUser();
      const responseData = userResponse.data.data;
      const userData = Array.isArray(responseData) ? responseData[0] : responseData;
      setUser(userData);

      // Сохраняем фото из данных Telegram виджета
      if (telegramUser.photo_url) {
        setTelegramPhoto(telegramUser.photo_url);
      }

      notifications.show({ title: t('common.success'), message: t('auth.telegramAuth'), color: 'green' });
    } catch {
      notifications.show({ title: t('common.error'), message: t('auth.telegramAuthError'), color: 'red' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Center h="80vh">
      <Card withBorder radius="md" p="xl" w={400}>
        <Stack gap="lg">
          <div>
            <Title order={2} ta="center">{config.APP_NAME}</Title>
            <Text size="sm" c="dimmed" ta="center">
              {mode === 'login' ? t('auth.loginTitle') : t('auth.registerTitle')}
            </Text>
          </div>

          {hasTelegramWidget && (
            <>
              <Center>
                <TelegramLoginButton
                  botName={config.TELEGRAM_BOT_NAME}
                  onAuth={handleTelegramWidgetAuth}
                  buttonSize="large"
                  requestAccess="write"
                />
              </Center>

              <Divider label={t('common.or')} labelPosition="center" />
            </>
          )}

          <form onSubmit={handleSubmit}>
            <Stack gap="sm">
              <TextInput
                label={t('auth.loginLabel')}
                placeholder={t('auth.loginPlaceholder')}
                value={formData.login}
                onChange={(e) => setFormData({ ...formData, login: e.target.value })}
                autoComplete="username"
                name="username"
              />
              <PasswordInput
                label={t('auth.passwordLabel')}
                placeholder={t('auth.passwordPlaceholder')}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                name="password"
              />
              {mode === 'register' && (
                <PasswordInput
                  label={t('auth.confirmPasswordLabel')}
                  placeholder={t('auth.confirmPasswordPlaceholder')}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  autoComplete="new-password"
                  name="confirm-password"
                />
              )}
              <Button
                type="submit"
                leftSection={mode === 'login' ? <IconLogin size={18} /> : <IconUserPlus size={18} />}
                loading={loading}
              >
                {mode === 'login' ? t('auth.login') : t('auth.register')}
              </Button>
            </Stack>
          </form>

          <Text size="sm" ta="center">
            {mode === 'login' ? (
              <>
                {t('auth.noAccount')}{' '}
                <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setMode('register')}>
                  {t('auth.register')}
                </Text>
              </>
            ) : (
              <>
                {t('auth.hasAccount')}{' '}
                <Text component="span" c="blue" style={{ cursor: 'pointer' }} onClick={() => setMode('login')}>
                  {t('auth.login')}
                </Text>
              </>
            )}
          </Text>
        </Stack>
      </Card>
    </Center>
  );
}