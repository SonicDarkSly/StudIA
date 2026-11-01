import {
  ApiOutlined,
  CodeOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  MessageOutlined,
  RobotOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import type { ReactNode } from 'react';

const ICONS: Record<string, ReactNode> = {
  chat: <MessageOutlined aria-hidden />,
  skill: <ExperimentOutlined aria-hidden />,
  mcp: <ApiOutlined aria-hidden />,
  command: <CodeOutlined aria-hidden />,
  agent: <RobotOutlined aria-hidden />,
  claudemd: <FileTextOutlined aria-hidden />,
  hooks: <ThunderboltOutlined aria-hidden />,
};

export const generatorIcon = (key: string): ReactNode => ICONS[key] ?? <MessageOutlined aria-hidden />;
