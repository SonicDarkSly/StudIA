import type { Llama } from 'node-llama-cpp';

export type NodeLlamaCpp = typeof import('node-llama-cpp');

let nlc: Promise<NodeLlamaCpp> | undefined;
let llama: Promise<Llama> | undefined;

export function llamaCpp(): Promise<NodeLlamaCpp> {
  nlc ??= import('node-llama-cpp');
  return nlc;
}

export function llamaInstance(): Promise<Llama> {
  llama ??= llamaCpp().then((m) => m.getLlama());
  return llama;
}
