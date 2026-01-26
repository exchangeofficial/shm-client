import { useState } from 'react';
import { Modal, Stack, Group, Button, Text, NumberInput, Select, Loader, ActionIcon, Badge, Card } from '@mantine/core';
import { IconX } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { userApi } from '../api/client';
import ConfirmModal from './ConfirmModal';

interface PaySystem {
  name: string;
  shm_url: string;
  paysystem: string;
  allow_deletion: number;
  recurring: number;
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
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [autopaymentToDelete, setAutopaymentToDelete] = useState<{ paysystem: string; name: string } | null>(null);

  const loadPaySystems = async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const response = await userApi.getPaySystems();
      const rawData = response.data.data || [];
      // Дедупликация по paysystem
      const seen = new Set<string>();
      const data = rawData.filter((ps: PaySystem) => {
        if (seen.has(ps.paysystem)) return false;
        seen.add(ps.paysystem);
        return true;
      });
      setPaySystems(data);
      if (data.length > 0) {
        setSelectedPaySystem(data[0].paysystem);
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

  const openDeleteConfirm = (paysystem: string, name: string) => {
    setAutopaymentToDelete({ paysystem, name });
    setDeleteConfirmOpen(true);
  };

  const handleDeleteAutopayment = async () => {
    if (!autopaymentToDelete) return;
    setDeleting(autopaymentToDelete.paysystem);
    try {
      await userApi.deleteAutopayment(autopaymentToDelete.paysystem);
      notifications.show({
        title: 'Успешно',
        message: 'Автоплатёж удалён',
        color: 'green',
      });
      setDeleteConfirmOpen(false);
      setAutopaymentToDelete(null);
      // Перезагружаем список
      setLoaded(false);
      loadPaySystems();
    } catch {
      notifications.show({
        title: 'Ошибка',
        message: 'Не удалось удалить автоплатёж',
        color: 'red',
      });
    } finally {
      setDeleting(null);
    }
  };

  const handlePay = () => {
    const paySystem = paySystems.find(ps => ps.paysystem === selectedPaySystem);
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
    <>
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
            {/* Список с автоплатежами для удаления */}
            {paySystems.some(ps => ps.allow_deletion === 1) && (
              <Card withBorder p="sm" radius="md">
                <Text size="sm" fw={500} mb="xs">Сохранённые способы оплаты</Text>
                <Stack gap="xs">
                  {paySystems.filter(ps => ps.allow_deletion === 1).map(ps => (
                    <Group key={ps.paysystem} justify="space-between">
                      <Group gap="xs">
                        <Text size="sm">{ps.name}</Text>
                        <Badge size="xs" variant="light" color="blue">Автоплатёж</Badge>
                      </Group>
                      <ActionIcon
                        size="sm"
                        color="red"
                        variant="subtle"
                        loading={deleting === ps.paysystem}
                        onClick={() => openDeleteConfirm(ps.paysystem, ps.name)}
                      >
                        <IconX size={14} />
                      </ActionIcon>
                    </Group>
                  ))}
                </Stack>
              </Card>
            )}
            <Select
              label="Платёжная система"
              placeholder="Выберите платёжную систему"
              data={paySystems.map(ps => ({ value: ps.paysystem, label: ps.name }))}
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

      <ConfirmModal
        opened={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteAutopayment}
        title="Удаление способа оплаты"
        message={`Вы уверены, что хотите удалить способ оплаты "${autopaymentToDelete?.name || ''}"?`}
        confirmLabel="Удалить"
        confirmColor="red"
        loading={deleting !== null}
      />
    </>
  );
}
