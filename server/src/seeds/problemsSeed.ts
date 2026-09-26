import { Problem } from '../domain/entities/Problem.js';

export const INITIAL_PROBLEMS: Problem[] = [
  new Problem({
    id: 'prob-parking-lot',
    slug: 'parking-lot',
    title: 'Design a Multi-Floor Parking Lot',
    difficulty: 'MEDIUM',
    estimatedTimeMinutes: 45,
    summary:
      'Design an automated low-level system for a multi-floor parking lot capable of issuing tickets, allocating spots dynamically based on vehicle type, computing flexible parking fees, and handling concurrent gate entry/exit.',
    functionalRequirements: [
      'The parking lot has multiple floors, and each floor has designated parking spots.',
      'Supports multiple vehicle types: Motorcycle/Bike (Compact), Car (Standard), Truck/Bus (Large), and Electric Vehicle (EV with charging spot).',
      'Entry gate automatically issues an entry ticket with timestamp, allocated spot, and vehicle details upon arrival.',
      'Exit gate accepts the ticket, computes parking duration and fee, processes payment, and marks the spot as vacant.',
      'Display boards at the entrance and each floor must reflect real-time spot availability per vehicle type.',
      'Support dynamic/pluggable parking fee calculation strategies (e.g., flat hourly, vehicle-type tiered, peak-hour surge).',
    ],
    nonFunctionalRequirements: [
      'Thread-Safe Concurrency: Multiple entry and exit gates operating simultaneously must never double-book any parking spot.',
      'Extensibility (Open/Closed Principle): Adding a new vehicle type (e.g., Bicycle or Autonomous Drone) or new payment method should not modify core parking lot logic.',
      'Low Latency: Spot allocation algorithm should quickly assign the nearest vacant spot (e.g., lowest floor first).',
      'High Cohesion & Low Coupling: Separate fee calculation, display notifications, and slot management into distinct responsibilities.',
    ],
    constraints: [
      'Maximum 4 floors with up to 100 spots per floor.',
      'A vehicle can only park in a spot that fits its size or larger (e.g., a Bike can park in a Standard spot if all Compacts are full, but a Truck cannot park in a Compact spot).',
      'The parking lot does not support pre-booking in this version.',
    ],
    requiredEntities: [
      'ParkingLot',
      'ParkingFloor',
      'ParkingSpot',
      'Vehicle',
      'Ticket',
      'Payment',
      'DisplayBoard',
      'ParkingFeeStrategy',
    ],
    suggestedPatterns: [
      'Strategy Pattern (for customizable fee calculation algorithms)',
      'Factory Pattern (for vehicle and spot creation)',
      'Observer Pattern (for updating display boards when spot status changes)',
      'Singleton Pattern (for central ParkingLot coordinator instance)',
    ],
  }),

  new Problem({
    id: 'prob-elevator-system',
    slug: 'elevator-system',
    title: 'Design an Elevator Control System',
    difficulty: 'MEDIUM',
    estimatedTimeMinutes: 45,
    summary:
      'Design an object-oriented controller for a bank of multiple elevators in a high-rise building, orchestrating car movement, dispatching requests efficiently, and managing internal and external user dispatch buttons.',
    functionalRequirements: [
      'The building has N floors and a bank of M elevators.',
      'Each elevator car can move UP, DOWN, or remain IDLE, with open/closed door states.',
      'Users can issue External Requests (hall calls with desired direction UP or DOWN from any floor).',
      'Passengers inside a car can issue Internal Requests (destination floor selections).',
      'The central Dispatcher must assign incoming floor calls to the optimal elevator car based on proximity, current direction, and load.',
      'Support elevator emergency state, overload detection, and scheduled maintenance modes.',
    ],
    nonFunctionalRequirements: [
      'Minimizing Wait Time & Energy: Dispatching algorithm should be modular and swappable (e.g., FCFS, SCAN / Elevator Algorithm, LOOK algorithm).',
      'State Pattern Integrity: An elevator in motion cannot open doors; an elevator with doors open cannot move.',
      'Thread Safety: Internal button presses and hall call allocations must handle concurrent requests without race conditions.',
      'Testability: Movement simulations and floor arrival callbacks should be easily decoupled and unit-testable.',
    ],
    constraints: [
      'Building has 20 floors (1 to 20) and 3 elevators.',
      'Maximum elevator capacity is 10 passengers or 800 kg.',
      'Door open duration is simulated as a fixed time delay.',
    ],
    requiredEntities: [
      'ElevatorController',
      'ElevatorCar',
      'ElevatorDoor',
      'InternalButtonPanel',
      'HallButton',
      'Dispatcher',
      'DispatchStrategy',
      'FloorRequest',
    ],
    suggestedPatterns: [
      'State Pattern (for elevator motion and door states: Idle, MovingUp, MovingDown, Maintenance)',
      'Strategy Pattern (for dispatching algorithms like SCAN, LOOK, or Shortest Seek)',
      'Observer Pattern (for notifying floor displays and controllers on floor arrivals)',
      'Command Pattern (for queuing and executing floor requests)',
    ],
  }),

  new Problem({
    id: 'prob-vending-machine',
    slug: 'vending-machine',
    title: 'Design an Automated Vending Machine',
    difficulty: 'EASY',
    estimatedTimeMinutes: 35,
    summary:
      'Design a state-driven low-level architecture for a snack and beverage vending machine supporting product selection, multi-denomination coin/cash insertion, change calculation, and inventory replenishment.',
    functionalRequirements: [
      'Supports inventory management across multiple trays/shelves with distinct slots, capacities, and item prices.',
      'Users select an item code (e.g., A1, B2) to inspect price and stock availability.',
      'Accepts money in multiple coin and bill denominations (e.g., $1, $5, 25¢, 10¢).',
      'Validates whether inserted money meets or exceeds the selected product price.',
      'Dispenses the selected product and calculates exact change from internal cash inventory.',
      'Allows user to cancel transaction and receive full refund of inserted money prior to dispensing.',
      'Provides an administrative interface for maintenance technicians to refill inventory and collect collected cash.',
    ],
    nonFunctionalRequirements: [
      'Strict State Invariant Enforcement: Money cannot be inserted during dispensing; items cannot be dispensed without sufficient balance.',
      'Accurate Change Algorithm: Exact change calculation using greedy or DP coin-change logic with safety fallback if machine lacks change.',
      'High Encapsulation: Internal cash vault balances and inventory counts must be shielded from external manipulation.',
    ],
    constraints: [
      'Machine holds up to 20 distinct products with a max capacity of 10 units each.',
      'If the machine cannot provide exact change, transaction must cancel and refund user money.',
    ],
    requiredEntities: [
      'VendingMachine',
      'VendingMachineState',
      'Inventory',
      'Product',
      'Slot',
      'CoinVault',
      'Coin',
      'Bill',
    ],
    suggestedPatterns: [
      'State Pattern (IdleState, MoneyInsertedState, DispensingState, OutOfOrderState)',
      'Chain of Responsibility / Strategy (for denomination validation and change dispensing)',
      'Singleton Pattern (for central machine hardware coordinator)',
    ],
  }),
];
