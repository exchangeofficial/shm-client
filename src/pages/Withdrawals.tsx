import { useState, useEffect } from 'react';
import { Text, Stack, Loader, Center, Paper, Title, Table, Pagination, Badge } from '@mantine/core';
import { api } from '../api/client';

interface Withdraw {
  withdraw_id: number;
  user_service_id: number;
  service_id: number;
  cost: number;
  total: number;
  discount: number;
  bonus: number;
  months: number;
  qnt: number;
  create_date: string;
  withdraw_date: string;
  end_date: string;
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState<Withdraw[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        const response = await api.get('/user/withdraw');
        setWithdrawals(response.data.data || []);
      } catch (error) {
        console.error('Failed to fetch withdrawals:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchWithdrawals();
  }, []);

  const paginatedWithdrawals = withdrawals.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(withdrawals.length / perPage);

  if (loading) {
    return (
      <Center h={300}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      <Title order={2}>Списания</Title>

      {withdrawals.length === 0 ? (
        <Paper withBorder p="xl" radius="md">
          <Center>
            <Text c="dimmed">История списаний пуста</Text>
          </Center>
        </Paper>
      ) : (
        <>
          <Paper withBorder radius="md" style={{ overflow: 'hidden' }}>
            <Table.ScrollContainer minWidth={600}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>ID</Table.Th>
                    <Table.Th>Дата списания</Table.Th>
                    <Table.Th>Дата окончания</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Стоимость</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Скидка</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Бонус</Table.Th>
                    <Table.Th style={{ textAlign: 'right' }}>Итого</Table.Th>
                    <Table.Th>Период</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {paginatedWithdrawals.map((w) => (
                    <Table.Tr key={w.withdraw_id}>
                      <Table.Td>
                        <Text size="sm">{w.withdraw_id}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {w.withdraw_date ? new Date(w.withdraw_date).toLocaleDateString('ru-RU') : '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {w.end_date ? new Date(w.end_date).toLocaleDateString('ru-RU') : '-'}
                        </Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text size="sm">{w.cost} ₽</Text>
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {w.discount > 0 ? (
                          <Text size="sm" c="green">-{w.discount}%</Text>
                        ) : (
                          <Text size="sm" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        {w.bonus > 0 ? (
                          <Text size="sm" c="red">-{w.bonus} ₽</Text>
                        ) : (
                          <Text size="sm" c="dimmed">-</Text>
                        )}
                      </Table.Td>
                      <Table.Td style={{ textAlign: 'right' }}>
                        <Text size="sm" fw={500} c="red">-{w.total} ₽</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge variant="light" color="blue">
                          {w.months} мес. × {w.qnt}
                        </Badge>
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
    </Stack>
  );
}
