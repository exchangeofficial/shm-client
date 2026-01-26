import { useState } from 'react';
import { Modal, Stack, Group, Button, TextInput } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { promoApi } from '../api/client';

interface PromoModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function PromoModal({ opened, onClose, onSuccess }: PromoModalProps) {
  const [promoCode, setPromoCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleApply = async () => {
    if (!promoCode.trim()) {
      notifications.show({
        title: 'Ошибка',
        message: 'Введите промокод',
        color: 'red',
      });
      return;
    }

    setLoading(true);
    try {
      await promoApi.apply(promoCode.trim());
      notifications.show({
        title: 'Успешно',
        message: 'Промокод применён',
        color: 'green',
      });
      setPromoCode('');
      onClose();
      onSuccess?.();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 'Не удалось применить промокод';
      notifications.show({
        title: 'Ошибка',
        message: errorMessage,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setPromoCode('');
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Ввести промокод"
    >
      <Stack gap="md">
        <TextInput
          label="Промокод"
          placeholder="Введите промокод"
          value={promoCode}
          onChange={(e) => setPromoCode(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
        />
        <Group justify="flex-end">
          <Button variant="light" onClick={handleClose}>
            Отмена
          </Button>
          <Button onClick={handleApply} loading={loading}>
            Применить
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
