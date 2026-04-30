---
name: diagram-styles
description: Conventions for Mermaid, PlantUML, and ASCII diagrams used across design artifacts. Use when creating visual diagrams in design documents.
license: MIT
---

# Diagram Styles and Conventions

Use these conventions when creating diagrams for design documents. Consistent styling improves readability and maintainability.

## Mermaid Diagrams

Mermaid is the preferred diagram format for most design artifacts.

### Block Diagram

Use for system components and their relationships.

```mermaid
graph TD
    subgraph System["System Boundary"]
        A[Component A]
        B[Component B]
        C[Component C]
    end

    D[External System] --> A
    A --> B
    B --> C
    C --> D

    style System fill:#f9f9f9,stroke:#333,stroke-width:2px
    style D fill:#fff3cd,stroke:#ffc107
```

### Sequence Diagram

Use for interaction flows between components or services.

```mermaid
sequenceDiagram
    participant Client
    participant API as API Gateway
    participant Service as Service A
    participant DB as Database

    Client->>API: Request
    API->>Service: Forward request
    Service->>DB: Query data
    DB-->>Service: Return data
    Service-->>API: Response
    API-->>Client: Response

    Note over Client,DB: Synchronous request-response flow
```

### State Diagram

Use for component states and transitions.

```mermaid
stateDiagram-v2
    [*] --> Idle
    Idle --> Running: Start
    Running --> Paused: Pause
    Running --> [*]: Stop
    Paused --> Running: Resume
    Paused --> [*]: Abort

    note right of Running
        Active processing
    end note
```

### Deployment Diagram

Use for infrastructure and deployment topology.

```mermaid
graph TB
    subgraph Cloud["Cloud Environment"]
        subgraph VPC["Virtual Network"]
            subgraph AZ1["Availability Zone 1"]
                LB[Load Balancer]
                PodA1[Pod A-1]
                PodA2[Pod A-2]
            end
            subgraph AZ2["Availability Zone 2"]
                PodB1[Pod B-1]
                PodB2[Pod B-2]
            end
        end
        Redis[(Redis Cache)]
        DB[(Primary DB)]
        MQ[(Message Queue)]
    end

    Client[Client App] --> LB
    LB --> PodA1
    LB --> PodA2
    LB --> PodB1
    LB --> PodB2
    PodA1 --> DB
    PodA2 --> DB
    PodB1 --> Redis
    PodB2 --> MQ
```

### Component Diagram

Use for internal component structure and dependencies.

```mermaid
graph LR
    subgraph Application
        UI[UI Layer]
        App[Application Layer]
        Domain[Domain Layer]
        Infra[Infrastructure Layer]
    end

    UI --> App
    App --> Domain
    Domain --> Infra

    Infra --> DB[(Database)]
    Infra --> Cache[(Cache)]
    Infra --> MQ[Message Queue]

    style Domain fill:#e1f5fe,stroke:#0288d1
    style UI fill:#f3e5f5,stroke:#7b1fa2
```

### Data Flow Diagram

Use for showing how data moves through the system.

```mermaid
graph LR
    Source[Data Source] --> Extract[Extract]
    Extract --> Transform[Transform]
    Transform --> Load[Load]
    Load --> Warehouse[(Data Warehouse)]

    Warehouse --> Analytics[Analytics]
    Warehouse --> API[API Layer]

    Analytics --> Dashboard[Dashboard]
    API --> Client[Client App]

    style Warehouse fill:#e8f5e9,stroke:#2e7d32
```

### Context Diagram

Use for system boundaries and external entities.

```mermaid
graph TD
    System[SYSTEM
    Core System]

    Ext1[External System A] --> System
    Ext2[External System B] --> System
    User[User] <--> System
    Ext3[External System C] <--> System

    style System fill:#e3f2fd,stroke:#1565c0,stroke-width:3px
    style User fill:#fff3e0,stroke:#e65100
    style Ext1 fill:#fce4ec,stroke:#c2185b
    style Ext2 fill:#e8f5e9,stroke:#2e7d32
    style Ext3 fill:#f3e5f5,stroke:#7b1fa2
```

## Mermaid Styling Conventions

| Element | Style | Use |
|---|---|---|
| `subgraph` | `fill:#f9f9f9,stroke:#333` | Group related components |
| `style` | `fill:#e3f2fd,stroke:#1565c0` | System boundary (blue) |
| `style` | `fill:#fff3e0,stroke:#e65100` | User/actor (orange) |
| `style` | `fill:#e8f5e9,stroke:#2e7d32` | Infrastructure (green) |
| `style` | `fill:#fce4ec,stroke:#c2185b` | External system (pink) |
| `style` | `fill:#e1f5fe,stroke:#0288d1` | Domain/business logic (light blue) |
| `Note` | `Note over A,B` | Cross-component notes |

## PlantUML Diagrams

Use PlantUML for UML-specific diagrams (class, component, activity).

### Class Diagram

```puml
@startuml
abstract class Component {
    +start(): void
    +stop(): void
    +getStatus(): Status
}

class ServiceA {
    +process(data): Result
    +validate(input): boolean
}

class ServiceB {
    +transform(data): Transformed
}

Component <|-- ServiceA
Component <|-- ServiceB
ServiceA --> ServiceB : uses

enum Status {
    RUNNING
    STOPPED
    ERROR
}
@enduml
```

### Component Diagram

```puml
@startuml
[Client] --> [API Gateway]
[API Gateway] --> [Auth Service]
[API Gateway] --> [Core Service]
[Auth Service] --> [(User DB)]
[Core Service] --> [(Data Store)]
[Core Service] --> [Message Queue]
@enduml
```

### Activity Diagram

```puml
@startuml
start
:Receive request;
if (Valid?) then (yes)
  :Process request;
  :Update state;
  :Return response;
else (no)
  :Log error;
  :Return error;
endif
stop
@enduml
```

## ASCII Diagrams

Use ASCII for simple layouts, quick sketches, or when Mermaid/PlantUML rendering is not available.

### Component Layout

```
┌─────────────────────────────────────────────────┐
│                   System Boundary                │
│                                                 │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐  │
│  │  Client   │───▶│  API GW  │───▶│  Service  │  │
│  │  Layer    │    │          │    │  Layer   │  │
│  └──────────┘    └──────────┘    └─────┬────┘  │
│                                        │       │
│  ┌──────────┐    ┌──────────┐    ┌─────▼────┐  │
│  │  Cache   │◀───│  Queue   │◀───│  Domain   │  │
│  │  Layer   │    │  Layer   │    │  Layer   │  │
│  └──────────┘    └──────────┘    └──────────┘  │
│                                                 │
└─────────────────────────────────────────────────┘
```

### Data Flow

```
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │  Source  │────▶│ Process │────▶│  Sink   │
  │ (Reader)│     │ (Worker)│     │(Writer) │
  └─────────┘     └─────────┘     └─────────┘
       │                 │                │
       ▼                 ▼                ▼
  ┌─────────┐     ┌─────────┐     ┌─────────┐
  │  Queue  │     │   Log   │     │ Database│
  └─────────┘     └─────────┘     └─────────┘
```

### Deployment Topology

```
                    ┌──────────────┐
                    │   Client     │
                    │   (Browser)  │
                    └──────┬───────┘
                           │ HTTPS
                    ┌──────▼───────┐
                    │  Load Balancer│
                    └──────┬───────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
      ┌───────▼───┐ ┌─────▼────┐ ┌─────▼────┐
      │  Server A  │ │ Server B │ │ Server C │
      │  (Primary) │ │ (Primary)│ │ (Primary)│
      └──────┬─────┘ └─────┬────┘ └─────┬────┘
             │             │             │
      ┌──────▼─────────────▼─────────────▼────┐
      │              Database Cluster          │
      │        (Primary + 2 Replicas)          │
      └────────────────────────────────────────┘
```

## Diagram Selection Guide

| Purpose | Best Format | Example |
|---|---|---|
| System overview | Block Diagram (Mermaid) | Components and relationships |
| Interaction flow | Sequence Diagram (Mermaid) | API calls, event sequences |
| State behavior | State Diagram (Mermaid) | Component lifecycle |
| Infrastructure | Deployment Diagram (Mermaid) | Servers, databases, networks |
| Internal structure | Component Diagram (Mermaid) | Layer architecture |
| Data movement | Data Flow Diagram (Mermaid) | ETL, pipelines |
| System boundaries | Context Diagram (Mermaid) | External entities |
| Class structure | Class Diagram (PlantUML) | OOP design |
| Process logic | Activity Diagram (PlantUML) | Decision flows |
| Quick sketch | ASCII | Simple layouts, rough drafts |

## Diagram Best Practices

1. **Keep it simple** — One diagram per concept; avoid overcrowding
2. **Use consistent styling** — Same colors for same element types across all diagrams
3. **Label everything** — Every node and edge should have a clear label
4. **Use subgraphs** — Group related components visually
5. **Add notes** — Use `Note` or `note` for clarifications
6. **Include a legend** — If using custom colors or symbols, explain them
7. **Version diagrams** — Reference diagram version in document metadata
8. **Keep diagrams close to text** — Place diagrams near their description
9. **Use ASCII fallback** — Provide ASCII version if Mermaid/PlantUML may not render
10. **Review for clarity** — Ask someone unfamiliar with the system to read the diagram
