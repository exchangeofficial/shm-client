import { ActionIcon, Menu } from '@mantine/core';
import { IconLanguage } from '@tabler/icons-react';
import { useTranslation } from 'react-i18next';

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <Menu shadow="md" width={150}>
      <Menu.Target>
        <ActionIcon variant="default" size="lg" aria-label="Change language" title={`Current language: ${currentLang.label}`}>
          <IconLanguage size={18} />
        </ActionIcon>
      </Menu.Target>

      <Menu.Dropdown>
        {languages.map((lang) => (
          <Menu.Item
            key={lang.code}
            onClick={() => i18n.changeLanguage(lang.code)}
            style={{
              fontWeight: i18n.language === lang.code ? 600 : 400,
              backgroundColor: i18n.language === lang.code ? 'var(--mantine-color-blue-light)' : undefined,
            }}
          >
            {lang.flag} {lang.label}
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
