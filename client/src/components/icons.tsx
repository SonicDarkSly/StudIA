import {
  ApiOutlined,
  AppstoreAddOutlined,
  CodeOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  MessageOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';
import type { ModeKey } from '@/types';

const ICONS: Record<ModeKey, ReactNode> = {
  chat: <MessageOutlined aria-hidden />,
  skill: <ExperimentOutlined aria-hidden />,
  mcp: <ApiOutlined aria-hidden />,
  command: <CodeOutlined aria-hidden />,
  agent: <RobotOutlined aria-hidden />,
  instructions: <FileTextOutlined aria-hidden />,
  hooks: <ThunderboltOutlined aria-hidden />,
  plugin: <AppstoreAddOutlined aria-hidden />,
};

export const modeIcon = (key: ModeKey): ReactNode => ICONS[key];
