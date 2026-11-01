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
import type { GeneratorKey } from '../types';

const ICONS: Record<GeneratorKey, ReactNode> = {
  chat: <MessageOutlined aria-hidden />,
  skill: <ExperimentOutlined aria-hidden />,
  mcp: <ApiOutlined aria-hidden />,
  command: <CodeOutlined aria-hidden />,
  agent: <RobotOutlined aria-hidden />,
  claudemd: <FileTextOutlined aria-hidden />,
  hooks: <ThunderboltOutlined aria-hidden />,
};

export const generatorIcon = (key: GeneratorKey): ReactNode => ICONS[key];
