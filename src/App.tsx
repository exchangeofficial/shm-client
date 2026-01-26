import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { useEffect } from 'react';
import { MantineProvider, createTheme, AppShell, Burger, Group, Text, NavLink, ActionIcon, useMantineColorScheme, useComputedColorScheme, Center, Loader } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { useDisclosure } from '@mantine/hooks';
import { BrowserRouter, Routes, Route, Link, useLocation, useNavigate } from 'react-router-dom';
import { IconServer, IconCreditCard, IconSun, IconMoon, IconUser, IconLogout, IconReceipt } from '@tabler/icons-react';
import { useStore } from './store/useStore';
import { auth } from './api/client';
import { config } from './config';

// Pages
import Services from './pages/Services';
import Payments from './pages/Payments';
import Withdrawals from './pages/Withdrawals';
import Profile from './pages/Profile';
import Login from './pages/Login';

const theme = createTheme({
  primaryColor: 'blue',
  fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif',
  defaultRadius: 'md',
  colors: {
    dark: [
      '#C1C2C5',
      '#A6A7AB',
      '#909296',
      '#5c5f66',
      '#373A40',
      '#2C2E33',
      '#25262b',
      '#1A1B1E',
      '#141517',
      '#101113',
    ],
  },
});

function ThemeToggle() {
  const { setColorScheme } = useMantineColorScheme();
  const computedColorScheme = useComputedColorScheme('light');

  return (
    <ActionIcon
      onClick={() => setColorScheme(computedColorScheme === 'light' ? 'dark' : 'light')}
      variant="default"
      size="lg"
      aria-label="Toggle color scheme"
    >
      {computedColorScheme === 'light' ? <IconMoon size={18} /> : <IconSun size={18} />}
    </ActionIcon>
  );
}

function AppContent() {
  const [opened, { toggle, close }] = useDisclosure();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, menuItems, themeConfig, isAuthenticated, isLoading, setUser, setIsLoading, logout } = useStore();

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('shm_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await auth.getCurrentUser();
        const responseData = response.data.data;
        const userData = Array.isArray(responseData) ? responseData[0] : responseData;
        setUser(userData);
      } catch {
        localStorage.removeItem('shm_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [setUser, setIsLoading]);

  const iconMap: Record<string, React.ReactNode> = {
    '/': <IconUser size={16} />,
    '/services': <IconServer size={16} />,
    '/payments': <IconCreditCard size={16} />,
    '/withdrawals': <IconReceipt size={16} />,
  };

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader size="lg" />
      </Center>
    );
  }

  // Show login page if not authenticated
  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <AppShell
      header={{ height: 60 }}
      navbar={{ width: 280, breakpoint: 'sm', collapsed: { mobile: !opened } }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger opened={opened} onClick={toggle} hiddenFrom="sm" size="sm" />
            <Text size="lg" fw={700} c="blue" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>{config.APP_NAME}</Text>
          </Group>
          <Group>
            <Text size="sm" style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>{user?.login}</Text>
            {themeConfig.allowUserThemeChange && <ThemeToggle />}
            <ActionIcon
              onClick={logout}
              variant="default"
              size="lg"
              aria-label="Выйти"
              title="Выйти"
            >
              <IconLogout size={18} />
            </ActionIcon>
          </Group>
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <AppShell.Section grow>
          {menuItems.filter(item => item.enabled).map((item) => (
            <NavLink
              key={item.id}
              component={Link}
              to={item.path}
              label={item.label}
              leftSection={iconMap[item.path]}
              active={location.pathname === item.path}
              variant="light"
              style={{ borderRadius: 8, marginBottom: 4 }}
              onClick={close}
            />
          ))}
        </AppShell.Section>
      </AppShell.Navbar>

      <AppShell.Main>
        <Routes>
          <Route path="/services" element={<Services />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/withdrawals" element={<Withdrawals />} />
          <Route path="*" element={<Profile />} />
        </Routes>
      </AppShell.Main>
    </AppShell>
  );
}

function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="top-right" />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
