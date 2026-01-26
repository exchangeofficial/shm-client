import { useState, useEffect } from 'react';
import { Modal, Stack, Text, Card, Group, Badge, Loader, Center, Button, Paper, Divider, Select, NumberInput, Alert } from '@mantine/core';
import { IconArrowLeft, IconCreditCard, IconCheck, IconWallet } from '@tabler/icons-react';
import { servicesApi, userApi } from '../api/client';
import { notifications } from '@mantine/notifications';

interface OrderService {
  service_id: number;
  name: string;
  category: string;
  cost: number;
  period: number;
  descr: string;
}

interface PaySystem {
  name: string;
  shm_url: string;
}

interface OrderServiceModalProps {
  opened: boolean;
  onClose: () => void;
  onOrderSuccess?: () => void;
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

const periodLabels: Record<number, string> = {
  1: 'месяц',
  3: '3 месяца',
  6: '6 месяцев',
  12: 'год',
};

export default function OrderServiceModal({ opened, onClose, onOrderSuccess }: OrderServiceModalProps) {
  const [services, setServices] = useState<OrderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<OrderService | null>(null);
  const [ordering, setOrdering] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [paySystems, setPaySystems] = useState<PaySystem[]>([]);
  const [selectedPaySystem, setSelectedPaySystem] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(0);
  const [paySystemsLoading, setPaySystemsLoading] = useState(false);
  const [paySystemsLoaded, setPaySystemsLoaded] = useState(false);

  useEffect(() => {
    if (opened) {
      fetchServices();
      fetchUserBalance();
    }
  }, [opened]);

  useEffect(() => {
    if (selectedService) {
      const needToPay = Math.max(0, Math.ceil((selectedService.cost - userBalance) * 100) / 100);
      setPayAmount(needToPay);
      if (userBalance < selectedService.cost && !paySystemsLoaded) {
        loadPaySystems();
      }
    }
  }, [selectedService, userBalance]);

  const fetchUserBalance = async () => {
    try {
      const response = await userApi.getProfile();
      const userData = response.data.data?.[0] || response.data.data;
      setUserBalance(userData?.balance || 0);
    } catch {
    }
  };

  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await servicesApi.order_list();
      setServices(response.data.data || []);
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить список услуг',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaySystems = async () => {
    if (paySystemsLoaded) return;
    setPaySystemsLoading(true);
    try {
      const response = await userApi.getPaySystems();
      const data = response.data.data || [];
      setPaySystems(data);
      if (data.length > 0) {
        setSelectedPaySystem(data[0].name);
      }
      setPaySystemsLoaded(true);
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить платёжные системы',
        color: 'red',
      });
    } finally {
      setPaySystemsLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedService) return;

    setOrdering(true);
    try {
      await servicesApi.order(selectedService.service_id);

      notifications.show({
        title: 'Успешно',
        message: `Услуга "${selectedService.name}" заказана и оплачена с баланса`,
        color: 'green',
      });

      onOrderSuccess?.();
      handleClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось заказать услугу',
        color: 'red',
      });
    } finally {
      setOrdering(false);
    }
  };

  const handleOrderAndPay = async () => {
    if (!selectedService) return;

    const paySystem = paySystems.find(ps => ps.name === selectedPaySystem);
    if (!paySystem) {
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите платёжную систему',
        color: 'red',
      });
      return;
    }

    setOrdering(true);
    try {
      await servicesApi.order(selectedService.service_id);
      window.open(paySystem.shm_url + payAmount, '_blank');

      notifications.show({
        title: 'Успешно',
        message: `Услуга "${selectedService.name}" заказана. Откройте окно оплаты.`,
        color: 'green',
      });

      onOrderSuccess?.();
      handleClose();
    } catch (error) {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось заказать услугу',
        color: 'red',
      });
    } finally {
      setOrdering(false);
    }
  };

  const handleClose = () => {
    setSelectedService(null);
    onClose();
  };

  const handleBack = () => {
    setSelectedService(null);
  };

  const groupedServices = services.reduce((acc, service) => {
    const category = normalizeCategory(service.category || 'other');
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(service);
    return acc;
  }, {} as Record<string, OrderService[]>);
  Object.values(groupedServices).forEach(categoryServices => {
    categoryServices.sort((a, b) => a.cost - b.cost);
  });

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={selectedService ? 'Детали услуги' : 'Заказать услугу'}
      size="lg"
    >
      {loading ? (
        <Center h={200}>
          <Loader size="lg" />
        </Center>
      ) : selectedService ? (
        <Stack gap="md">
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={16} />}
            onClick={handleBack}
            size="compact-sm"
            w="fit-content"
          >
            Назад к списку
          </Button>

          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              <Group justify="space-between">
                <Text fw={700} size="lg">{selectedService.name}</Text>
              </Group>

              <Divider />

              {selectedService.descr && (
                <Text size="sm" c="dimmed" style={{ whiteSpace: 'pre-wrap' }}>
                  {selectedService.descr}
                </Text>
              )}

              <Group justify="space-between" mt="md">
                <div>
                  <Text size="sm" c="dimmed">Стоимость</Text>
                  <Text fw={600} size="lg">{selectedService.cost} ₽</Text>
                </div>
                <div>
                  <Text size="sm" c="dimmed">Период</Text>
                  <Text fw={500}>
                    {periodLabels[selectedService.period] || `${selectedService.period} мес.`}
                  </Text>
                </div>
              </Group>
            </Stack>
          </Paper>

          <Alert
            variant="light"
            color={userBalance >= selectedService.cost ? 'green' : 'yellow'}
            icon={<IconWallet size={18} />}
          >
            <Group justify="space-between">
              <Text size="sm">Ваш баланс: <Text span fw={600}>{userBalance} ₽</Text></Text>
              {userBalance >= selectedService.cost ? (
                <Badge color="green" variant="light">Достаточно для оплаты</Badge>
              ) : (
                <Badge color="yellow" variant="light">Нужно пополнить на {Math.ceil((selectedService.cost - userBalance) * 100) / 100} ₽</Badge>
              )}
            </Group>
          </Alert>

          {userBalance >= selectedService.cost ? (
            <Button
              fullWidth
              size="md"
              color="green"
              leftSection={<IconCheck size={18} />}
              onClick={handleOrder}
              loading={ordering}
            >
              Заказать за {selectedService.cost} ₽
            </Button>
          ) : (
            <>
              <Paper withBorder p="md" radius="md">
                <Stack gap="md">
                  <Text fw={500}>Пополнить баланс</Text>

                  {paySystemsLoading ? (
                    <Group justify="center" py="md">
                      <Loader size="sm" />
                      <Text size="sm">Загрузка платёжных систем...</Text>
                    </Group>
                  ) : paySystems.length === 0 ? (
                    <Text c="dimmed" size="sm">Нет доступных платёжных систем</Text>
                  ) : (
                    <>
                      <Select
                        label="Платёжная система"
                        placeholder="Выберите платёжную систему"
                        data={paySystems.map(ps => ({ value: ps.name, label: ps.name }))}
                        value={selectedPaySystem}
                        onChange={setSelectedPaySystem}
                      />
                      <NumberInput
                        label="Сумма к оплате"
                        placeholder="Введите сумму"
                        value={payAmount}
                        onChange={setPayAmount}
                        min={Math.ceil((selectedService.cost - userBalance) * 100) / 100}
                        step={10}
                        decimalScale={2}
                        suffix=" ₽"
                        description={`Минимум: ${(Math.ceil((selectedService.cost - userBalance) * 100) / 100).toFixed(2)} ₽ (недостающая сумма)`}
                      />
                    </>
                  )}
                </Stack>
              </Paper>

              <Button
                fullWidth
                size="md"
                leftSection={<IconCreditCard size={18} />}
                onClick={handleOrderAndPay}
                loading={ordering}
                disabled={!selectedPaySystem || paySystemsLoading}
              >
                Заказать и оплатить {payAmount} ₽
              </Button>
            </>
          )}
        </Stack>
      ) : services.length === 0 ? (
        <Center h={200}>
          <Text c="dimmed">Нет доступных услуг для заказа</Text>
        </Center>
      ) : (
        <Stack gap="md">
          {Object.entries(groupedServices).map(([category, categoryServices]) => (
            <div key={category}>
              <Text fw={500} size="sm" c="dimmed" mb="xs">
                {categoryLabels[category] || category}
              </Text>
              <Stack gap="xs">
                {categoryServices.map((service) => (
                  <Card
                    key={service.service_id}
                    withBorder
                    radius="md"
                    p="sm"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedService(service)}
                  >
                    <Group justify="space-between">
                      <div>
                        <Text fw={500}>{service.name}</Text>
                        {service.descr && (
                          <Text size="xs" c="dimmed" lineClamp={1}>
                            {service.descr}
                          </Text>
                        )}
                      </div>
                      <Group gap="sm">
                        <Text fw={600}>{service.cost} ₽</Text>
                        <Text size="xs" c="dimmed">
                          / {periodLabels[service.period] || `${service.period} мес.`}
                        </Text>
                      </Group>
                    </Group>
                  </Card>
                ))}
              </Stack>
            </div>
          ))}
        </Stack>
      )}
    </Modal>
  );
}
