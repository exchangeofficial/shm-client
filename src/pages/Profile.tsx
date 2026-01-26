import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Button, TextInput, Avatar, Title, Modal, PasswordInput, Loader, Center } from '@mantine/core';
import { IconUser, IconPhone, IconBrandTelegram, IconLock, IconWallet, IconCreditCard } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { userApi, telegramApi } from '../api/client';
import PayModal from '../components/PayModal';
import PromoModal from '../components/PromoModal';
import { useStore } from '../store/useStore';

interface UserProfile {
  user_id: number;
  login: string;
  full_name?: string;
  phone?: string;
  balance: number;
  credit?: number;
  bonus?: number;
  gid: number;
  telegram_user_id?: number;
  settings?: {
    telegram?: {
      username?: string;
      chat_id?: number;
    };
  };
}

export default function Profile() {
  const { telegramPhoto } = useStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({ full_name: '', phone: '' });
  const [telegramUsername, setTelegramUsername] = useState<string | null>(null);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [promoModalOpen, setPromoModalOpen] = useState(false);
  const [telegramModalOpen, setTelegramModalOpen] = useState(false);
  const [telegramInput, setTelegramInput] = useState('');
  const [telegramSaving, setTelegramSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await userApi.getProfile();
        const responseData = response.data.data;
        const data = Array.isArray(responseData) ? responseData[0] : responseData;
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          phone: data.phone || '',
        });
        try {
          const telegramResponse = await telegramApi.getSettings();
          setTelegramUsername(telegramResponse.data.username || null);
        } catch {
          // Telegram не настроен
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      await userApi.updateProfile(formData);
      setProfile((prev) => prev ? { ...prev, ...formData } : null);
      setEditing(false);
      notifications.show({
        title: 'Успешно',
        message: 'Профиль обновлен',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось обновить профиль',
        color: 'red',
      });
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword) {
      notifications.show({
        title: 'Ошибка',
        message: 'Введите новый пароль',
        color: 'red',
      });
      return;
    }
    try {
      await userApi.changePassword(newPassword);
      setPasswordModalOpen(false);
      setNewPassword('');
      notifications.show({
        title: 'Успешно',
        message: 'Пароль изменен',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось изменить пароль',
        color: 'red',
      });
    }
  };

  const refreshProfile = async () => {
    const profileResponse = await userApi.getProfile();
    const profileData = profileResponse.data.data;
    const data = Array.isArray(profileData) ? profileData[0] : profileData;
    setProfile(data);
  };

  const openTelegramModal = () => {
    setTelegramInput(telegramUsername || '');
    setTelegramModalOpen(true);
  };

  const handleSaveTelegram = async () => {
    setTelegramSaving(true);
    try {
      await telegramApi.updateSettings({ username: telegramInput.trim().replace('@', '') });
      setTelegramUsername(telegramInput.trim().replace('@', '') || null);
      setTelegramModalOpen(false);
      notifications.show({
        title: 'Успешно',
        message: 'Telegram сохранён',
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось сохранить Telegram',
        color: 'red',
      });
    } finally {
      setTelegramSaving(false);
    }
  };

  if (loading || !profile) {
    return (
      <Center h="50vh">
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Профиль</Title>

      <Card withBorder radius="md" p="lg">
        <Group>
          <Avatar
            size={80}
            radius="xl"
            color="blue"
            src={telegramPhoto || undefined}
          >
            {!telegramPhoto && (profile.full_name?.charAt(0) || profile.login?.charAt(0)?.toUpperCase() || '?')}
          </Avatar>
          <div>
            <Text fw={500} size="lg">{profile.full_name || profile.login || 'Пользователь'}</Text>
            <Text size="sm" c="dimmed">{profile.login || '-'}</Text>
          </div>
        </Group>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" align="center">
          <div>
            <Text size="sm" c="dimmed">Баланс</Text>
            <Group gap="xs" align="baseline">
              <IconWallet size={24} />
              <Text size="xl" fw={700}>{profile.balance?.toFixed(2) || '0.00'} ₽</Text>
            </Group>
            {profile.credit && profile.credit > 0 && <Text size="xm" c="dimmed">Кредит: {profile.credit}</Text>}
          </div>
          <Button leftSection={<IconCreditCard size={18} />} onClick={() => setPayModalOpen(true)}>
            Пополнить
          </Button>
        </Group>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" align="center">
          <div>
              <Text size="xm" c="dimmed">Бонусы: {profile.bonus}</Text>
          </div>
          <Button onClick={() => setPromoModalOpen(true)}>
            Ввести промокод
          </Button>
        </Group>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Личные данные</Text>
          {!editing ? (
            <Button variant="light" size="xs" onClick={() => setEditing(true)}>
              Редактировать
            </Button>
          ) : (
            <Group gap="xs">
              <Button variant="light" size="xs" color="gray" onClick={() => setEditing(false)}>
                Отмена
              </Button>
              <Button size="xs" onClick={handleSave}>
                Сохранить
              </Button>
            </Group>
          )}
        </Group>

        <Stack gap="md">
          <TextInput
            label="Полное имя"
            leftSection={<IconUser size={16} />}
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
            disabled={!editing}
          />
          <TextInput
            label="Телефон"
            leftSection={<IconPhone size={16} />}
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            disabled={!editing}
          />
        </Stack>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between" mb="md">
          <Text fw={500}>Telegram</Text>
          <Button variant="light" size="xs" onClick={openTelegramModal}>
            {telegramUsername ? 'Изменить' : 'Привязать'}
          </Button>
        </Group>
        <Group>
          <IconBrandTelegram size={24} color="#0088cc" />
          {telegramUsername ? (
            <div>
              <Text size="sm">@{telegramUsername}</Text>
              <Text size="xs" c="dimmed">Привязан к аккаунту</Text>
            </div>
          ) : (
            <Text size="sm" c="dimmed">Telegram не привязан</Text>
          )}
        </Group>
      </Card>

      <Card withBorder radius="md" p="lg">
        <Text fw={500} mb="md">Безопасность</Text>
        <Stack gap="md">
          <Button variant="light" leftSection={<IconLock size={16} />} onClick={() => setPasswordModalOpen(true)}>
            Изменить пароль
          </Button>
        </Stack>
      </Card>

      <Modal
        opened={passwordModalOpen}
        onClose={() => { setPasswordModalOpen(false); setNewPassword(''); }}
        title="Изменить пароль"
      >
        <Stack gap="md">
          <PasswordInput
            label="Новый пароль"
            placeholder="Введите новый пароль"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          <Group justify="flex-end">
            <Button variant="light" onClick={() => { setPasswordModalOpen(false); setNewPassword(''); }}>
              Отмена
            </Button>
            <Button onClick={handleChangePassword}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>

      <PayModal opened={payModalOpen} onClose={() => setPayModalOpen(false)} />

      <PromoModal
        opened={promoModalOpen}
        onClose={() => setPromoModalOpen(false)}
        onSuccess={refreshProfile}
      />

      <Modal
        opened={telegramModalOpen}
        onClose={() => setTelegramModalOpen(false)}
        title="Привязать Telegram"
      >
        <Stack gap="md">
          <TextInput
            label="Telegram логин"
            placeholder="@username"
            value={telegramInput}
            onChange={(e) => setTelegramInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSaveTelegram()}
          />
          <Text size="xs" c="dimmed">
            Введите ваш Telegram логин (без @)
          </Text>
          <Group justify="flex-end">
            <Button variant="light" onClick={() => setTelegramModalOpen(false)}>
              Отмена
            </Button>
            <Button onClick={handleSaveTelegram} loading={telegramSaving}>
              Сохранить
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}