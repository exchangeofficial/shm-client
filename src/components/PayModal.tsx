import { useState } from 'react';
import { Modal, Stack, Group, Button, Text, NumberInput, Select, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { userApi } from '../api/client';

interface PaySystem {
  name: string;
  shm_url: string;
}

interface PayModalProps {
  opened: boolean;
  onClose: () => void;
}

export default function PayModal({ opened, onClose }: PayModalProps) {
  const [paySystems, setPaySystems] = useState<PaySystem[]>([]);
  const [selectedPaySystem, setSelectedPaySystem] = useState<string | null>(null);
  const [payAmount, setPayAmount] = useState<number | string>(100);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const loadPaySystems = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const response = await userApi.getPaySystems();
      const data = response.data.data || [];
      setPaySystems(data);
      if (data.length > 0) {
        setSelectedPaySystem(data[0].name);
      }
      setLoaded(true);
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось загрузить платёжные системы',
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePay = () => {
    const paySystem = paySystems.find(ps => ps.name === selectedPaySystem);
    if (!paySystem) {
      notifications.show({
        title: 'Ошибка',
        message: 'Выберите платёжную систему',
        color: 'red',
      });
      return;
    }
    window.open(paySystem.shm_url + payAmount, '_blank');
    onClose();
  };

  // Загружаем платёжные системы при открытии
  if (opened && !loaded && !loading) {
    loadPaySystems();
  }

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Пополнение баланса"
    >
      <Stack gap="md">
        {loading ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
            <Text size="sm">Загрузка платёжных систем...</Text>
          </Group>
        ) : paySystems.length === 0 ? (
          <Text c="dimmed">Нет доступных платёжных систем</Text>
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
              label="Сумма"
              placeholder="Введите сумму"
              value={payAmount}
              onChange={setPayAmount}
              min={1}
              step={10}
              decimalScale={2}
              suffix=" ₽"
            />
            <Group justify="flex-end">
              <Button variant="light" onClick={onClose}>
                Отмена
              </Button>
              <Button onClick={handlePay} disabled={!selectedPaySystem}>
                Оплатить
              </Button>
            </Group>
          </>
        )}
      </Stack>
    </Modal>
  );
}
