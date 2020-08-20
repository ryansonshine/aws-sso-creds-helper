declare module 'proxy-agent' {
  import { Agent, AgentOptions } from 'https';

  export default function ProxyAgent(options: AgentOptions | string): Agent;
}
