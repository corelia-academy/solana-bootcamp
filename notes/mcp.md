# Model Context Protocol

[Mermaid source](./images/mcp-architecture.mmd)

![Kiến trúc MCP cho Solana](./images/mcp-architecture.png)

```mermaid
flowchart LR
    Host[AI host] --> Client[MCP client]
    Client --> Server[MCP server]
    Server --> Read[Read-only Solana tools]
    Server --> Write[Signer-gated write tools]
    Read --> RPC[Solana RPC]
    Write --> RPC
```

Tools need clear names, descriptions, JSON Schemas, structured results, predictable errors, and least-privilege authorization. Separate read-only tools from actions that spend funds or submit transactions.
