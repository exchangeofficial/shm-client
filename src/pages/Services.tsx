import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Badge, Button, Modal, ActionIcon, Loader, Center, Paper, Title, Tabs, Code, CopyButton, Tooltip, Accordion, Box } from '@mantine/core';
import { IconQrcode, IconCopy, IconCheck, IconDownload, IconRefresh, IconChevronRight, IconTrash, IconPlus, IconPlayerStop } from '@tabler/icons-react';
import { useDisclosure } from '@mantine/hooks';
import { api, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';
import QrModal from '../components/QrModal';
import OrderServiceModal from '../components/OrderServiceModal';
import ConfirmModal from '../components/ConfirmModal';

interface ServiceInfo {
  category: string;
  cost: number;
  name: string;
}

interface UserService {
  user_service_id: number;
  service_id: number;
  name?: string;
  service: ServiceInfo;
  status: string;
  expire: string | null;
  created: string;
  parent: number | null;
  settings?: Record<string, unknown>;
  children?: UserService[];
}

const categoryLabels: Record<string, string> = {
  vpn: 'VPN',
  proxy: 'Прокси',
  web_tariff: 'Тарифы хостинга',
  web: 'Web хостинг',
  mysql: 'Базы данных',
  mail: 'Почта',
  hosting: 'Хостинг',
  other: 'Прочее',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  'ACTIVE': { label: 'Активна', color: 'green' },
  'NOT PAID': { label: 'Не оплачена', color: 'blue' },
  'BLOCK': { label: 'Заблокирована', color: 'red' },
  'PROGRESS': { label: 'В процессе', color: 'yellow' },
  'ERROR': { label: 'Ошибка', color: 'orange' },
  'INIT': { label: 'Инициализация', color: 'gray' },
};

function normalizeCategory(category: string): string {
  if (category.match(/remna|remnawave|marzban|marz|mz/i)) {
    return 'proxy';
  }
  if (category.match(/^(vpn|wg|awg|vpn-wg|vpn-awg)$/i)) {
    return 'vpn';
  }
  if (['web_tariff', 'web', 'mysql', 'mail', 'hosting'].includes(category)) {
    return category;
  }
  return 'other';
}

interface ServiceDetailProps {
  service: UserService;
  onDelete?: () => void;
}

function ServiceDetail({ service, onDelete }: ServiceDetailProps) {
  const [storageData, setStorageData] = useState<string | null>(null);
  const [subscriptionUrl, setSubscriptionUrl] = useState<string | null>(null);
  const [, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>('info');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmStop, setConfirmStop] = useState(false);

  const canDelete = ['BLOCK', 'NOT PAID', 'ERROR'].includes(service.status);
  const canStop = service.status === 'ACTIVE';

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/user/service?user_service_id=${service.user_service_id}`);
      notifications.show({
        title: 'Успешно',
        message: 'Услуга удалена',
        color: 'green',
      });
      setConfirmDelete(false);
      onDelete?.();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить услугу',
        color: 'red',
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleStop = async () => {
    setStopping(true);
    try {
      await userApi.stopService(service.user_service_id);
      notifications.show({
        title: 'Успешно',
        message: 'Услуга остановлена',
        color: 'green',
      });
      setConfirmStop(false);
      onDelete?.();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось остановить услугу',
        color: 'red',
      });
    } finally {
      setStopping(false);
    }
  };

  const category = normalizeCategory(service.service.category);

  useEffect(() => {
    const fetchData = async () => {
      if (category === 'proxy') {
        try {
          const mzResponse = await api.get(`/storage/manage/vpn_mrzb_${service.user_service_id}?format=json`);
          const url = mzResponse.data.subscription_url || mzResponse.data.response?.subscriptionUrl;
          if (url) {
            setSubscriptionUrl(url);
          }
          setActiveTab('config');
        } catch {
          try {
            const remnaResponse = await api.get(`/storage/manage/vpn_remna_${service.user_service_id}?format=json`);
            const url = remnaResponse.data.subscription_url || remnaResponse.data.response?.subscriptionUrl;
            if (url) {
              setSubscriptionUrl(url);
            }
          } catch {
            // Нет subscription URL
          }
        }
      } else if (category === 'vpn') {
        try {
          const vpnResponse = await api.get(`/storage/manage/vpn${service.user_service_id}`);
          const configData = vpnResponse.data;
          if (configData) {
            setStorageData(configData);
          }
          setActiveTab('config');
        } catch {
          // Нет конфигурации
        }
      }
      setLoading(false);
    };
    fetchData();
  }, [service.user_service_id, category]);

  const isVpn = category === 'vpn';
  const isProxy = category === 'proxy';
  const isVpnOrProxy = isVpn || isProxy;
  const statusInfo = statusLabels[service.status] || { label: service.status, color: 'gray' };

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <div>
          <Text fw={700} size="lg">{service.service.name}</Text>
          <Badge color={statusInfo.color} variant="light">
            {statusInfo.label}
          </Badge>
        </div>
        <Text size="sm" c="dimmed">ID: {service.user_service_id}</Text>
      </Group>

      <Tabs value={activeTab} onChange={setActiveTab}>
        <Tabs.List>

          <Tabs.Tab value="info">Информация</Tabs.Tab>
          {isVpnOrProxy &&service.status === 'ACTIVE' && <Tabs.Tab value="config">Подключение</Tabs.Tab>}
        </Tabs.List>

        <Tabs.Panel value="info" pt="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Статус:</Text>
              <Badge color={statusInfo.color} variant="light">{statusInfo.label}</Badge>
            </Group>
            <Group justify="space-between">
              <Text size="sm" c="dimmed">Стоимость:</Text>
              <Text size="sm">{service.service.cost} ₽</Text>
            </Group>
            {service.expire && (
              <Group justify="space-between">
                <Text size="sm" c="dimmed">Действует до:</Text>
                <Text size="sm">{new Date(service.expire as string).toLocaleDateString('ru-RU')}</Text>
              </Group>
            )}
            {service.children && service.children.length > 0 && (
              <>
                <Text size="sm" c="dimmed" mt="md">Включённые услуги:</Text>
                {service.children.map((child) => {
                  const childStatus = statusLabels[child.status] || { label: child.status, color: 'gray' };
                  return (
                    <Group key={child.user_service_id} justify="space-between" ml="md">
                      <Text size="sm">{child.service.name}</Text>
                      <Badge size="sm" color={childStatus.color} variant="light">{childStatus.label}</Badge>
                    </Group>
                  );
                })}
              </>
            )}
          </Stack>
        </Tabs.Panel>

        { service.status === 'ACTIVE' && (
          <Tabs.Panel value="config" pt="md">
            <Stack gap="md">
              {isProxy && subscriptionUrl && (
                <Paper withBorder p="md" radius="md">
                  <Text size="sm" fw={500} mb="xs">Ссылка подписки</Text>
                  <Group gap="xs">
                    <Code style={{ flex: 1, wordBreak: 'break-all' }}>{subscriptionUrl}</Code>
                    <CopyButton value={subscriptionUrl}>
                      {({ copied, copy }) => (
                        <Tooltip label={copied ? 'Скопировано!' : 'Копировать'}>
                          <ActionIcon color={copied ? 'teal' : 'gray'} variant="subtle" onClick={copy}>
                            {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </CopyButton>
                  </Group>
                </Paper>
              )}

              <Group>
                {(isVpn && storageData) || (isProxy && subscriptionUrl) ? (
                  <Button
                    leftSection={<IconQrcode size={16} />}
                    variant="light"
                    onClick={() => setQrModalOpen(true)}
                  >
                    QR-код
                  </Button>
                ) : null}

              {isVpn && storageData && (
                <Button
                  leftSection={<IconDownload size={16} />}
                  variant="light"
                  onClick={() => {
                    const blob = new Blob([storageData], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `vpn${service.user_service_id}.conf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Скачать конфиг
                </Button>
              )}
              </Group>

              <QrModal
                opened={qrModalOpen}
                onClose={() => setQrModalOpen(false)}
                data={isVpn ? (storageData || '') : (subscriptionUrl || '')}
                title={isVpn ? 'QR-код конфигурации VPN' : 'QR-код подписки'}
                filename={isVpn ? `vpn${service.user_service_id}` : undefined}
              />
            </Stack>
          </Tabs.Panel>
        )}
      </Tabs>

      {canStop && (
        <Button
          color="orange"
          variant="light"
          leftSection={<IconPlayerStop size={16} />}
          onClick={() => setConfirmStop(true)}
          mt="md"
          fullWidth
        >
          Остановить услугу
        </Button>
      )}

      {canDelete && (
        <Button
          color="red"
          variant="light"
          leftSection={<IconTrash size={16} />}
          onClick={() => setConfirmDelete(true)}
          mt="md"
          fullWidth
        >
          Удалить услугу
        </Button>
      )}

      <ConfirmModal
        opened={confirmStop}
        onClose={() => setConfirmStop(false)}
        onConfirm={handleStop}
        title="Остановить услугу"
        message="Услуга будет заблокирована. Восстановление возможно только через поддержку."
        confirmLabel="Остановить"
        confirmColor="orange"
        loading={stopping}
      />

      <ConfirmModal
        opened={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Удалить услугу"
        message="Вы уверены, что хотите удалить эту услугу? Это действие необратимо."
        confirmLabel="Удалить"
        confirmColor="red"
        loading={deleting}
      />
    </Stack>
  );
}

function ServiceCard({ service, onClick, isChild = false }: { service: UserService; onClick: () => void; isChild?: boolean }) {
  const statusInfo = statusLabels[service.status] || { label: service.status, color: 'gray' };

  return (
    <Card
      withBorder
      radius="md"
      p={isChild ? 'sm' : 'md'}
      ml={isChild ? 'lg' : 0}
      style={{ cursor: 'pointer' }}
      onClick={onClick}
    >
      <Group justify="space-between">
        <Group gap="sm">
          {isChild && <IconChevronRight size={14} color="gray" />}
          <div>
            <Text fw={500} size={isChild ? 'sm' : 'md'}>{service.service.name}</Text>
            {service.expire && (
              <Text size="xs" c="dimmed">
                до {new Date(service.expire as string).toLocaleDateString('ru-RU')}
              </Text>
            )}
          </div>
        </Group>
        <Group gap="sm">
          {service.service.cost > 0 && (
            <Text size="sm" c="dimmed">{service.service.cost} ₽</Text>
          )}
          <Badge color={statusInfo.color} variant="light" size={isChild ? 'sm' : 'md'}>
            {statusInfo.label}
          </Badge>
        </Group>
      </Group>
    </Card>
  );
}

export default function Services() {
  const [services, setServices] = useState<UserService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<UserService | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [orderModalOpened, { open: openOrderModal, close: closeOrderModal }] = useDisclosure(false);

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user/service');
      const data: UserService[] = response.data.data || [];

      const serviceMap = new Map<number, UserService>();
      data.forEach(s => serviceMap.set(s.user_service_id, { ...s, children: [] }));

      const rootServices: UserService[] = [];
      serviceMap.forEach(service => {
        if (service.parent && serviceMap.has(service.parent)) {
          const parent = serviceMap.get(service.parent)!;
          parent.children = parent.children || [];
          parent.children.push(service);
        } else if (!service.parent) {
          rootServices.push(service);
        }
      });

      setServices(rootServices);
    } catch (error) {
      console.error('Failed to fetch services:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleServiceClick = (service: UserService) => {
    setSelectedService(service);
    open();
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = normalizeCategory(service.service.category);
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, UserService[]>);

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Group justify="space-between">
        <Title order={2}>Мои услуги</Title>
        <Group>
          <Button leftSection={<IconPlus size={16} />} onClick={openOrderModal}>
            Заказать услугу
          </Button>
          <Button leftSection={<IconRefresh size={16} />} variant="light" onClick={fetchServices}>
            Обновить
          </Button>
        </Group>
      </Group>

      {services.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Stack align="center" gap="md">
              <Text c="dimmed">У вас пока нет активных услуг</Text>
              <Button leftSection={<IconPlus size={16} />} onClick={openOrderModal}>
                Заказать услугу
              </Button>
            </Stack>
          </Center>
        </Paper>
      ) : (
        <Accordion variant="separated" radius="md" multiple defaultValue={Object.keys(groupedServices)}>
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <Accordion.Item key={category} value={category}>
              <Accordion.Control>
                <Group>
                  <Text fw={500}>{categoryLabels[category] || category}</Text>
                  <Badge variant="light" size="sm">{categoryServices.length}</Badge>
                </Group>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
                  {categoryServices.map((service) => (
                    <Box key={service.user_service_id}>
                      <ServiceCard
                        service={service}
                        onClick={() => handleServiceClick(service)}
                      />
                      {service.children && service.children.length > 0 && (
                        <Stack gap="xs" mt="xs">
                          {service.children.map((child) => (
                            <ServiceCard
                              key={child.user_service_id}
                              service={child}
                              onClick={() => handleServiceClick(child)}
                              isChild
                            />
                          ))}
                        </Stack>
                      )}
                    </Box>
                  ))}
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          ))}
        </Accordion>
      )}

      <Modal opened={opened} onClose={close} title="Детали услуги" size="lg">
        {selectedService && (
          <ServiceDetail
            service={selectedService}
            onDelete={() => {
              close();
              fetchServices();
            }}
          />
        )}
      </Modal>

      <OrderServiceModal
        opened={orderModalOpened}
        onClose={closeOrderModal}
        onOrderSuccess={fetchServices}
      />
    </Stack>
  );
}