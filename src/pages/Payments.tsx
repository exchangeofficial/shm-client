import { useState, useEffect } from 'react';
import { Card, Text, Stack, Group, Badge, Button, Loader, Center, Paper, Title, Table, Pagination } from '@mantine/core';
import { IconCreditCard, IconPlus } from '@tabler/icons-react';
import { api } from '../api/client';
import { useStore } from '../store/useStore';
import PayModal from '../components/PayModal';

interface Payment {
  id: number;
  date: string;
  money: number;
  pay_system_id?: string;
}

export default function Payments() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const perPage = 10;
  const { user } = useStore();

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const response = await api.get('/user/pay');
        setPayments(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch payments:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchPayments();
  }, []);

  const paginatedPayments = payments.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(payments.length / perPage);

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
        <Title order={2}>Платежи</Title>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setPayModalOpen(true)}>Пополнить баланс</Button>
      </Group>

      <Card withBorder radius="md" p="lg">
        <Group justify="space-between">
          <Group>
            <IconCreditCard size={24} />
            <div>
              <Text size="sm" c="dimmed">Текущий баланс</Text>
              <Text size="xl" fw={700}>{user?.balance ?? 0} ₽</Text>
            </div>
          </Group>
          {user?.credit && user.credit > 0 && (
            <Badge color="orange" size="lg" variant="light">Кредит: {user.credit} ₽</Badge>
          )}
          {user?.discount && user.discount > 0 && (
            <Badge color="orange" size="lg" variant="light">Скидка: {user.discount} %</Badge>
          )}
        </Group>
      </Card>

      {payments.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Text c="dimmed">История платежей пуста</Text>
          </Center>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={500}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Дата</Table.Th>
                    <Table.Th>Платёжная система</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Сумма</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedPayments.map((payment) => (
                    <Table.Tr key={payment.id}>
                      <Table.Td>
                        <Text size="sm">{new Date(payment.date).toLocaleDateString('ru-RU')}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">{payment.pay_system_id || '-'}</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text
                          size="sm"
                          fw={500}
                          c={payment.money > 0 ? 'green' : 'red'}
                        >
                          {payment.money > 0 ? '+' : ''}{payment.money} ₽
                        </Text>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Table.ScrollContainer>
          </Paper>

          {totalPages > 1 && (
            <Center>
              <Pagination total={totalPages} value={page} onChange={setPage} />
            </Center>
          )}
        </>
      )}

      <PayModal opened={payModalOpen} onClose={() => setPayModalOpen(false)} />
    </Stack>
  );
}