---
name: game-dev-architecture
description: Domain knowledge for game development architecture including rendering pipelines, game logic, asset management, physics, AI, and networking. Use when working on game development projects.
license: MIT
compatibility: Requires understanding of game engines, rendering, and game design patterns
metadata:
  domain: game-development
  tags: "game-engine,rendering,physics,AI,networking,assets"
---

# Game Development Architecture Knowledge

Use this domain knowledge when designing game systems, engine architecture, or game-specific features.

## High-Level Game Engine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Game Engine                              │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐  │
│  │  Rendering   │  │   Physics   │  │   Audio System     │  │
│  │  Pipeline    │  │   Engine    │  │                    │  │
│  └──────┬──────┘  └──────┬──────┘  └────────┬───────────┘  │
│         │                │                   │              │
│  ┌──────▼────────────────▼───────────────────▼───────────┐  │
│  │              Game Logic Layer                         │  │
│  │  (Gameplay, AI, State Machines, Scripting)            │  │
│  └──────┬──────────────────────────────────┬────────────┘  │
│         │                                  │               │
│  ┌──────▼──────┐                  ┌────────▼──────────┐    │
│  │  Asset Mgmt │                  │  Networking/Net   │    │
│  │  & I/O      │                  │  (Multiplayer)    │    │
│  └──────┬──────┘                  └────────┬──────────┘    │
│         │                                  │               │
│  ┌──────▼──────────────────────────────────▼───────────┐    │
│  │              Platform / OS Abstraction              │    │
│  │  (Input, Windowing, Threading, Memory)              │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Rendering Pipeline Patterns

### Forward Rendering

Best for: Small-to-medium scenes, mobile, simple lighting

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Geometry   │───▶│  Light Culling│───▶│  Pixel Shading│
│  Processing │    │  (per-object) │    │  (per-pixel)  │
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                                       ┌──────▼──────┐
                                       │  Framebuffer │
                                       └─────────────┘
```

### Deferred Rendering

Best for: Large scenes, many lights, PC/console

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Geometry   │───▶│  G-Buffer     │───▶│  Light Pass  │
│  Processing │    │  (Position,  │    │  (per-light) │
│             │    │   Normal,    │    └──────┬──────┘
│             │    │   Material)  │           │
└─────────────┘    └──────────────┘           │
                                               │
                                        ┌──────▼──────┐
                                        │  Composite │
                                        └──────┬──────┘
                                               │
                                        ┌──────▼──────┐
                                        │  Framebuffer │
                                        └─────────────┘
```

### Tile-Based / Clustered Forward

Best for: Mobile (TBR), modern PC (clustered)

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Geometry   │───▶│  Tile/Cluster │───▶│  Tile Shading│
│  Processing │    │  Light Bound  │    │  (per-tile)  │
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                                       ┌──────▼──────┐
                                       │  Framebuffer │
                                       └─────────────┘
```

## Game Architecture Patterns

### Entity-Component-System (ECS)

Best for: Performance-critical games, large entity counts

```
┌──────────────────────────────────────────────────────┐
│                    Data (Flat Arrays)                 │
│                                                      │
│  Position: [x,y,z] [x,y,z] [x,y,z] [x,y,z] ...      │
│  Velocity: [vx,vy,vz] [vx,vy,vz] ...                 │
│  Health:   [100] [80] [50] [100] ...                 │
│  Mesh:     [id1] [id2] [id1] [id3] ...               │
│                                                      │
├──────────────────────────────────────────────────────┤
│                    Systems (Process Data)             │
│                                                      │
│  MovementSystem:  reads Position + Velocity           │
│  CollisionSystem: reads Position + Mesh               │
│  DamageSystem:    reads Health + Position             │
│  RenderSystem:    reads Position + Mesh               │
└──────────────────────────────────────────────────────┘
```

### Component-Based Architecture

Best for: Traditional OOP games, rapid prototyping

```
Entity (Player)
├── TransformComponent (position, rotation, scale)
├── MeshComponent (renderable mesh)
├── PhysicsComponent (collider, rigidbody)
├── HealthComponent (HP, maxHP, regen)
├── InputComponent (key bindings, actions)
└── AnimationComponent (skeleton, clips, state)
```

### Game Loop Architecture

```
┌─────────────────────────────────────────────────────┐
│                  Game Loop                           │
│                                                     │
│  ┌───────────┐    ┌───────────┐    ┌────────────┐  │
│  │  Input    │───▶│  Update   │───▶│  Render    │  │
│  │  Poll     │    │  (Fixed   │    │  (Variable │  │
│  │           │    │   dt)     │    │   dt)      │  │
│  └───────────┘    └─────┬─────┘    └─────┬──────┘  │
│                         │                 │         │
│                    ┌────▼─────┐    ┌──────▼──────┐  │
│                    │  Physics │───▶│  Post-Proc  │  │
│                    │  Step    │    │  (Bloom,   │  │
│                    └──────────┘    │   SSAO,    │  │
│                                     │   Tonemap) │  │
│                                     └──────┬──────┘  │
│                                            │         │
│                                    ┌───────▼───────┐  │
│                                    │  Present to   │  │
│                                    │  Screen       │  │
│                                    └───────────────┘  │
└─────────────────────────────────────────────────────┘
```

## Asset Management

### Asset Pipeline

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Source  │───▶│  Import   │───▶│  Process  │───▶│  Runtime │
│  Assets  │    │  (Convert)│    │  (Optimize)│   │  Format  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
   (.fbx, .png,    (.mesh,      (.mesh.bin,    (.bin,
    .wav, .mp4)     .texture)    .texture.bin)  .wav.bin)
```

### Asset Loading Strategies

| Strategy | Description | Use Case |
|---|---|---|
| **Asset Bundles** | Group assets into loadable packages | Level loading, DLC |
| **Streaming** | Load/unload assets based on visibility | Open world |
| **Async Loading** | Load in background thread | Menu transitions |
| **Preloading** | Load all assets at startup | Small games, mobile |
| **Reference Counting** | Track usage, unload when 0 | Dynamic content |

### Asset Types and Formats

| Type | Source Format | Runtime Format | Compression |
|---|---|---|---|
| **3D Mesh** | .fbx, .obj | .bin, .mesh | Draco, quantized |
| **Texture** | .png, .tga, .exr | .ktx2, .astc | ASTC, BC, ETC2 |
| **Audio** | .wav, .flac | .ogg, .opus | Vorbis, Opus |
| **Animation** | .fbx, .bvh | .anim, .bin | Delta encoding |
| **Shader** | .hlsl, .glsl | .spv, .metal | N/A |
| **Data** | .json, .csv | .bin, .flatbuffers | LZ4, Zstd |

## Physics System

### Physics Pipeline

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐
│  Collision  │───▶│  Constraint   │───▶│  Integration│
│  Detection  │    │  Solving      │    │  (Solve)    │
│  (Broad +   │    │  (Jacobian,   │    │             │
│   Narrow)   │    │   Iterations) │    │             │
└─────────────┘    └──────────────┘    └──────┬──────┘
                                              │
                                       ┌──────▼──────┐
                                       │  Transform  │
                                       │  Update     │
                                       └─────────────┘
```

### Physics Considerations

- **Determinism** — Fixed timestep, reproducible results for networking
- **Collision layers** — Bitmask-based filtering
- **Broad phase** — Spatial partitioning (BVH, grid, sweep-and-prune)
- **Narrow phase** — GJK/EPA, SAT for penetration depth
- **Constraint solver** — Iterative (PGS) vs. direct (LU)
- **Sleeping** — Deactivate inactive rigid bodies

## AI System

### Behavior Tree Architecture

```
                    Root (Selector)
                   /      |       \
          Sequence      Sequence   Sequence
          /    \         /    \      |
     Task    Task    Task    Task  Task
     (Move)  (Aim)   (Shoot) (Reload)(Patrol)
```

### AI Decision-Making Patterns

| Pattern | Complexity | Use Case |
|---|---|---|
| **Finite State Machine** | Low | Simple behaviors, clear states |
| **Behavior Tree** | Medium | Hierarchical, reusable tasks |
| **Utility AI** | Medium-High | Weighted decision making |
| **GOAP** | High | Goal-oriented, planning |
| **ML/DNN** | Very High | Adaptive, learning-based |

### AI Components

- **Perception** — Line of sight, hearing radius, memory
- **Navigation** — Pathfinding (A*), navigation meshes, steering behaviors
- **Decision** — Behavior trees, state machines, utility scoring
- **Animation** — State machines, IK, blending, root motion

## Networking for Games

### Multiplayer Architecture

| Model | Description | Pros | Cons |
|---|---|---|---|
| **P2P** | Peers connect directly | No server cost | Cheating, NAT issues |
| **Client-Server (Authoritative)** | Server validates all actions | Secure, consistent | Server cost, latency |
| **Client-Server (Relaxed)** | Client predicts, server corrects | Better feel | Complexity, desync |
| **Lockstep** | All clients run same simulation | Deterministic | Latency sensitive |

### Networking Patterns

```
┌─────────────────────────────────────────────────────┐
│              Client-Server Architecture               │
│                                                      │
│  ┌─────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │ Client  │───▶│  Server     │───▶│  Client     │  │
│  │ (Predict│    │ (Authoritat.)│    │ (Reconcile) │  │
│  │  + Lag  │    │             │    │             │  │
│  │  Comp.) │    │             │    │             │  │
│  └─────────┘    └─────────────┘    └─────────────┘  │
│                                                      │
│  ┌────────────────── Replication ──────────────────┐  │
│  │  State Synchronization  │  Event Broadcasting   │  │
│  │  (Position, rotation,  │  (Damage, spawn,      │  │
│  │   health, inventory)   │   abilities)           │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Netcode Considerations

- **Tick rate** — 30Hz (indie), 60Hz (competitive), 125Hz+ (FPS)
- **Interpolation** — Smooth rendering of remote entities
- **Extrapolation** — Predict remote entity positions
- **Lag compensation** — Server rewinds to client's shot time
- **Entity prediction** — Client predicts own actions immediately
- **Snapshot delta** — Only send changed fields
- **Connection handling** — Handshake, keepalive, reconnection

## Performance Targets

### Platform Performance Budgets

| Platform | Target FPS | Draw Calls | Triangles | Active Objects |
|---|---|---|---|---|
| **Mobile (mid-range)** | 30-60 | <100 | <500K | <200 |
| **Mobile (flagship)** | 60 | <200 | <2M | <500 |
| **Switch** | 30-60 | <300 | <5M | <1000 |
| **PC (low)** | 60 | <500 | <10M | <2000 |
| **PC (high)** | 60-144 | <1000 | <50M | <5000 |
| **Console (PS5/XSX)** | 30-60 | <800 | <30M | <3000 |

### Profiling Checklist

- [ ] Frame time budget per platform
- [ ] GPU-bound vs. CPU-bound analysis
- [ ] Draw call batching (instancing, GPU skinning)
- [ ] Memory allocation rate (GC pressure)
- [ ] Cache locality (SoA vs. AoS)
- [ ] Thread utilization (job system balance)
- [ ] Network bandwidth usage
- [ ] Audio CPU usage (DSP, mixing)

## Design Document Focus Areas

When creating design artifacts for game development, emphasize:

1. **Rendering architecture** — Forward/deferred/tile-based, post-processing pipeline
2. **Game loop design** — Fixed vs. variable timestep, update/render separation
3. **Entity architecture** — ECS vs. component-based, data layout
4. **Physics system** — Engine choice, collision layers, determinism requirements
5. **AI architecture** — Behavior trees, navigation, perception system
6. **Asset pipeline** — Import, processing, runtime format, streaming strategy
7. **Networking model** — P2P vs. server, tick rate, replication strategy
8. **Audio architecture** — Spatial audio, mixing, streaming vs. loaded
9. **Platform targets** — Performance budgets, platform-specific constraints
10. **Tooling** — Editor features, debugging tools, profiling integration
