const mongoose = require('mongoose');
require('dotenv').config();

// Import Centralized AI Models
const { StudentKnowledge } = require('./models/AIModels');

const universeKnowledge = [
    // --- ADVANCED COMPUTING ---
    {
        category: 'Advanced Computing',
        subject: 'Artificial Intelligence',
        topic: 'Neural Networks Deep Dive',
        content: 'Deep Neural Networks (DNNs) simulate the human brain using layers of interconnected nodes. Key concepts include Backpropagation (error minimization), Activation Functions (ReLU, Sigmoid), and Optimizers (Adam, SGD). They power computer vision, NLP, and generative AI.',
        codeExamples: [
            'import tensorflow as tf\nmnodel = tf.keras.Sequential([\n tf.keras.layers.Dense(128, activation="relu"),\n tf.keras.layers.Dense(10, activation="softmax")\n])',
            'import torch\nimport torch.nn as nn\nclass SimpleNet(nn.Module):\n def __init__(self):\n  super().__init__()\n  self.l1 = nn.Linear(10, 5)'
        ],
        explanations: [
            'Layers: Input -> Hidden -> Output',
            'Weights are adjusted during training to minimize loss',
            'Requires large datasets for effective learning'
        ],
        tags: ['ai', 'deep-learning', 'neural-networks', 'advanced'],
        difficulty: 'advanced',
        updatedBy: 'UniverseMaster'
    },
    {
        category: 'Advanced Computing',
        subject: 'Quantum Computing',
        topic: 'Qubits and Superposition',
        content: 'Quantum computing uses quantum bits (qubits) which can exist in multiple states simultaneously (superposition). This allows parallel computation of vast possibilities. Entanglement allows instant correlation between qubits regardless of distance.',
        explanations: [
            'Classical Bit: 0 or 1',
            'Qubit: Alpha|0> + Beta|1>',
            'Exponential speedup for specific problems like factorization (Shor\'s Algorithm)'
        ],
        tags: ['quantum', 'physics', 'computing', 'future-tech'],
        difficulty: 'advanced',
        updatedBy: 'UniverseMaster'
    },

    // --- MODERN PROGRAMMING ---
    {
        category: 'Programming Languages',
        subject: 'Rust',
        topic: 'Memory Safety without Garbage Collection',
        content: 'Rust empowers everyone to build reliable and efficient software. It guarantees memory safety via a concept called "Ownership" and "Borrowing", eliminating null pointer dereferences and buffer overflows at compile time.',
        codeExamples: [
            'fn main() {\n    let s1 = String::from("hello");\n    let s2 = s1; // Ownership moved to s2\n    // println!("{}", s1); // Error! s1 is invalid\n}'
        ],
        tags: ['rust', 'systems-programming', 'safety', 'performance'],
        difficulty: 'intermediate',
        updatedBy: 'UniverseMaster'
    },
    {
        category: 'Programming Languages',
        subject: 'Go (Golang)',
        topic: 'Concurrency with Goroutines',
        content: 'Go is designed for scalability and concurrency. Goroutines are lightweight threads managed by the Go runtime. Channels are used to communicate safely between goroutines.',
        codeExamples: [
            'func main() {\n    ch := make(chan string)\n    go func() { ch <- "ping" }()\n    msg := <-ch\n    fmt.Println(msg)\n}'
        ],
        tags: ['go', 'golang', 'backend', 'concurrency'],
        difficulty: 'intermediate',
        updatedBy: 'UniverseMaster'
    },

    // --- SOFT SKILLS & CAREER ---
    {
        category: 'Career Development',
        subject: 'Interview Preparation',
        topic: 'STAR Method',
        content: 'The STAR method is a structured manner of responding to behavioral interview questions by discussing the specific Situation, Task, Action, and Result of the situation you are describing.',
        explanations: [
            'Situation: Set the scene',
            'Task: Describe the purpose',
            'Action: Explain what YOU did',
            'Result: Share the outcome'
        ],
        tags: ['career', 'interview', 'soft-skills', 'communication'],
        difficulty: 'beginner',
        updatedBy: 'UniverseMaster'
    },

    // --- HISTORY & HUMANITIES ---
    {
        category: 'Humanities',
        subject: 'World History',
        topic: 'Industrial Revolution',
        content: 'The transition to new manufacturing processes in Great Britain, continental Europe, and the United States, in the period from about 1760 to sometime between 1820 and 1840. It marked a major turning point in history; almost every aspect of daily life was influenced in some way.',
        tags: ['history', 'industrial-revolution', 'society', 'economics'],
        difficulty: 'intermediate',
        updatedBy: 'UniverseMaster'
    },
    {
        category: 'Humanities',
        subject: 'Psychology',
        topic: 'Cognitive Biases',
        content: 'Systematic patterns of deviation from norm or rationality in judgment. Examples include Confirmation Bias (favoring info that confirms beliefs) and Dunning-Kruger Effect (low ability individuals overestimating their ability).',
        tags: ['psychology', 'biases', 'thinking', 'human-behavior'],
        difficulty: 'intermediate',
        updatedBy: 'UniverseMaster'
    }
];

const seedUniverse = async () => {
    try {
        console.log('🌌 Connecting to Universal Knowledge Database...');
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });

        console.log('🧠 Injecting Universe Master Brain Knowledge...');
        // We do NOT delete existing, we append to enrich
        await StudentKnowledge.insertMany(universeKnowledge);

        console.log('✅ Universe Knowledge Injection Complete!');
        console.log(`🚀 Added ${universeKnowledge.length} advanced topics to the Student Brain.`);
        console.log('Topics: AI, Quantum Computing, Rust, Go, Career Skills, History, Psychology.');

        await mongoose.connection.close();
        process.exit(0);

    } catch (error) {
        console.error('❌ Universal Knowledge Upload Failed:', error);
        process.exit(1);
    }
};

seedUniverse();
