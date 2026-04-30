---
name: embedded-systems
description: Domain knowledge for embedded systems, IoT, and cyber-physical system design. Covers hardware/software co-design, safety standards, real-time constraints, and communication protocols. Use when working on embedded, IoT, or CPS projects.
license: MIT
compatibility: Requires knowledge of embedded platforms, RTOS, and hardware interfaces
metadata:
  domain: embedded-systems
  tags: "IoT,CPS,RTOS,safety-critical,hardware-software"
---

# Embedded Systems Design Knowledge

Use this domain knowledge when designing embedded systems, IoT devices, or cyber-physical systems.

## System Architecture Patterns

### Hardware/Software Co-Design

```
┌─────────────────────────────────────────────┐
│           Hardware Platform                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │  MCU/SoC │  │  Sensors │  │ Actuators│  │
│  │ (ARM/RISC│  │ (I2C/SPI)│  │ (PWM/I2C)│  │
│  │   -V/MIPS│  └──────────┘  └──────────┘  │
│  └────┬─────┘                                │
│       │                                      │
│  ┌────▼─────┐  ┌──────────┐  ┌──────────┐  │
│  │  Memory  │  │  Comms   │  │  Power   │  │
│  │ (SRAM/   │  │ (UART/   │  │  Mgmt    │  │
│  │  Flash)  │  │  SPI/    │  │          │  │
│  └──────────┘  │  CAN)    │  └──────────┘  │
└────────────────┴──────────┴────────────────┘
       │
┌──────▼──────────────────────────────────────┐
│           Software Stack                    │
│  ┌──────────────────────────────────────┐   │
│  │  Application Layer                    │   │
│  │  (Business logic, algorithms)         │   │
│  ├──────────────────────────────────────┤   │
│  │  Middleware Layer                     │   │
│  │  (RTOS, drivers, protocols)           │   │
│  ├──────────────────────────────────────┤   │
│  │  HAL / BSP Layer                      │   │
│  │  (Hardware abstraction)               │   │
│  └──────────────────────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Layered Architecture for Embedded

| Layer | Responsibility | Examples |
|---|---|---|
| **Application** | Business logic, algorithms, state machines | Control loops, signal processing, protocol handlers |
| **Middleware** | RTOS services, communication, data management | FreeRTOS tasks, MQTT client, ring buffers |
| **HAL/BSP** | Hardware abstraction, peripheral drivers | GPIO, ADC, DMA, SPI, I2C, UART drivers |

## Communication Protocols

### On-Device Protocols

| Protocol | Speed | Use Case | Topology |
|---|---|---|---|
| **I2C** | 100kHz-4MHz | Sensors, EEPROM, displays | Multi-master, multi-slave |
| **SPI** | Up to 50MHz | Flash, displays, high-speed ADC | Master-slave, point-to-point |
| **UART** | Up to 4.5Mbps | Debug, GPS, modems | Point-to-point |
| **CAN** | 1Mbps | Automotive, industrial | Multi-drop, bus |
| **PWM** | Variable | Motor control, servo | Point-to-point |

### Off-Device / Network Protocols

| Protocol | Range | Use Case | Power |
|---|---|---|---|
| **BLE** | ~100m | Consumer IoT, wearables | Low |
| **WiFi** | ~100m | High-bandwidth IoT | Medium-High |
| **Zigbee** | ~10-100m | Home automation mesh | Low |
| **LoRa** | ~2-15km | Long-range, low-data | Very Low |
| **NB-IoT** | Cellular | Wide-area IoT | Medium |
| **Ethernet** | ~100m | Industrial, gateway | N/A |

## Real-Time Constraints

### Real-Time System Classification

| Type | Deadline | Consequence of Missing | Example |
|---|---|---|---|
| **Hard RT** | Must meet | Catastrophic failure | Airbag controller, brake ECU |
| **Firm RT** | Should meet | Degraded service | Video streaming, audio processing |
| **Soft RT** | Best effort | Reduced quality | Sensor logging, UI updates |

### Real-Time Design Patterns

1. **Rate-Monotonic Scheduling** — Fixed priority based on period (shorter period = higher priority)
2. **Earliest-Deadline-First** — Dynamic priority based on deadline
3. **Periodic Task Model** — Tasks execute at fixed intervals
4. **Aperiodic Task Model** — Tasks execute in response to events
5. **Deadline-Monotonic Scheduling** — Fixed priority based on deadline

### Timing Analysis Checklist

- [ ] Worst-case execution time (WCET) estimated for all tasks
- [ ] Task periods and deadlines defined
- [ ] Priority assignment follows RM or DM rules
- [ ] Interrupt latency measured and bounded
- [ ] Context switch overhead accounted for
- [ ] Bus contention analyzed (shared resources)
- [ ] Cache behavior analyzed (warm vs. cold)
- [ ] Memory bandwidth sufficient for all DMA transfers

## Safety Standards

### ISO 26262 (Automotive)

| ASIL Level | Description | Example |
|---|---|---|
| **QM** | Quality Management (no safety goal) | Infotainment |
| **ASIL A** | Low risk of injury | Window control |
| **ASIL B** | Moderate risk | Steering assist |
| **ASIL C** | High risk of serious injury | Brake assist |
| **ASIL D** | Very high risk of fatal injury | Emergency braking, steering control |

**Key requirements per ASIL level:**
- **ASIL A/B:** Basic fault detection, diagnostic coverage ~60-90%
- **ASIL C:** Enhanced fault detection, diagnostic coverage ~90-99%
- **ASIL D:** Maximum fault detection, diagnostic coverage ~99-99.9%

### DO-178C (Aviation)

| DAL Level | Description |
|---|---|
| **DAL A** | Catastrophic failure condition |
| **DAL B** | Hazardous failure condition |
| **DAL C** | Major failure condition |
| **DAL D** | Minor failure condition |
| **DAL E** | No significant effect |

### IEC 61508 (General Industrial)

| SIL Level | PFD Range | Approx. Annual Failure Rate |
|---|---|---|
| **SIL 1** | 10⁻² to 10⁻¹ | 1 in 10 to 1 in 100 |
| **SIL 2** | 10⁻³ to 10⁻² | 1 in 100 to 1 in 1000 |
| **SIL 3** | 10⁻⁴ to 10⁻³ | 1 in 1000 to 1 in 10000 |
| **SIL 4** | 10⁻⁵ to 10⁻⁴ | 1 in 10000 to 1 in 100000 |

## Power Management

### Power Modes

| Mode | Power | Wake Time | Use Case |
|---|---|---|---|
| **Active** | Highest | Instant | Processing, communication |
| **Idle** | Medium | ~1ms | Waiting for next task |
| **Sleep** | Low | ~10ms | Short pauses |
| **Deep Sleep** | Very Low | ~100ms | Long pauses, RTC active |
| **Halt/Off** | Lowest | ~1s | Battery storage, transport |

### Power Optimization Techniques

1. **Clock gating** — Disable clocks to unused peripherals
2. **Dynamic voltage/frequency scaling (DVFS)** — Adjust voltage and frequency based on workload
3. **Peripheral power management** — Power down unused peripherals
4. **Interrupt-driven wake-up** — Use external interrupts instead of polling
5. **Bulk data transfer** — Accumulate data and transmit in bursts
6. **Sleep scheduling** — Enter lowest power mode between tasks

## Memory Constraints

### Typical Memory Budgets

| Platform | RAM | Flash | Considerations |
|---|---|---|---|
| **8-bit MCU** (AVR, 8051) | 256B-8KB | 4KB-128KB | No MMU, manual memory management |
| **32-bit MCU** (ARM Cortex-M0) | 8KB-256KB | 32KB-2MB | No MMU, MPU optional |
| **32-bit MCU** (ARM Cortex-M4/M7) | 256KB-2MB | 256KB-16MB | FPU, MPU, cache |
| **MPU** (ARM Cortex-A) | 128MB-8GB | NAND/eMMC | MMU, OS, file system |

### Memory Safety Checklist

- [ ] Stack size allocated per task (with margin for interrupts)
- [ ] Heap size sufficient for dynamic allocations
- [ ] No unbounded recursion (stack overflow risk)
- [ ] Buffer sizes validated against input constraints
- [ ] DMA buffers aligned to cache lines (if cached)
- [ ] Memory pools used instead of frequent malloc/free
- [ ] Critical data stored in non-volatile memory with backup

## Firmware Development Practices

### State Machine Design

```c
// Example: Finite State Machine pattern
typedef enum {
    STATE_IDLE,
    STATE_RUNNING,
    STATE_PAUSED,
    STATE_ERROR,
    STATE_SHUTDOWN
} SystemState_t;

SystemState_t current_state = STATE_IDLE;

void state_machine_update(void) {
    switch (current_state) {
        case STATE_IDLE:
            if (start_requested) {
                current_state = STATE_RUNNING;
                init_system();
            }
            break;
        case STATE_RUNNING:
            if (pause_requested) {
                current_state = STATE_PAUSED;
                suspend_system();
            } else if (error_detected) {
                current_state = STATE_ERROR;
                handle_error();
            }
            break;
        case STATE_PAUSED:
            if (resume_requested) {
                current_state = STATE_RUNNING;
                resume_system();
            } else if (abort_requested) {
                current_state = STATE_SHUTDOWN;
                shutdown_system();
            }
            break;
        case STATE_ERROR:
            if (reset_requested) {
                current_state = STATE_IDLE;
                reset_system();
            }
            break;
    }
}
```

### Debugging Techniques

1. **SWD/JTAG** — Hardware debug interface
2. **UART printf** — Serial output for logging
3. **LED indicators** — Simple status/debug
4. **Watchdog timer** — Detect hangs
5. **Memory corruption detection** — Canary values, stack overflow hooks
6. **Logic analyzer** — Protocol debugging
7. **Oscilloscope** — Signal integrity, timing

### OTA Update Considerations

- Use A/B partition scheme (dual bank)
- Sign firmware images (RSA/ECDSA)
- Verify checksum before flashing
- Implement rollback on failure
- Minimize update time (critical for battery devices)

## Design Document Focus Areas

When creating design artifacts for embedded systems, emphasize:

1. **Hardware selection rationale** — MCU/SoC choice, sensor selection, power budget
2. **Real-time analysis** — Task periods, priorities, WCET, schedulability
3. **Safety analysis** — FMEA, HAZOP, fault tree analysis
4. **Communication architecture** — On-device and off-device protocols
5. **Power budget** — Active, sleep, and deep sleep power consumption
6. **Memory budget** — RAM, Flash, stack, heap allocation
7. **Firmware architecture** — State machines, RTOS tasks, interrupt handling
8. **Test strategy** — HIL, SIL, MIL, unit tests, integration tests
9. **Manufacturing considerations** — Test points, programming interface, calibration
10. **Regulatory compliance** — EMC, safety certifications, certifications needed
