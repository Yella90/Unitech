// components/sections/TechStack.tsx
'use client';

import { motion } from "framer-motion";
import { 
  FaReact, 
  FaNodeJs, 
  FaPython, 
  FaDocker, 
  FaAws, 
  FaDatabase,
  FaMicrochip,
  FaRobot,
  FaCogs,
  FaBolt,
  FaWifi,
  FaBrain,
  FaChartLine,
  FaArrowsAltH,
  FaCube
} from "react-icons/fa";
import { 
  SiNextdotjs, 
  SiTailwindcss, 
  SiSupabase, 
  SiTensorflow,
  SiArduino,
  SiRaspberrypi,
  SiEspressif,
  SiJupyter,
  SiOpencv,
  SiMqtt,
  SiInfluxdb,
  SiNvidia,
  SiHuggingface
} from "react-icons/si";
import { 
  GiCpu, 
  GiCircuitry, 
  GiBoltShield, 
  GiSolarPower, 
  GiGears 
} from "react-icons/gi";

const techCategories = [
  {
    name: "💻 Développement Web & SaaS",
    technologies: [
      { icon: <FaReact className="h-8 w-8 text-[#61DAFB]" />, name: "React", color: "hover:border-[#61DAFB]" },
      { icon: <SiNextdotjs className="h-8 w-8 text-black" />, name: "Next.js", color: "hover:border-black" },
      { icon: <FaNodeJs className="h-8 w-8 text-[#68A063]" />, name: "Node.js", color: "hover:border-[#68A063]" },
      { icon: <SiTailwindcss className="h-8 w-8 text-[#38BDF8]" />, name: "Tailwind", color: "hover:border-[#38BDF8]" },
      { icon: <SiSupabase className="h-8 w-8 text-[#3ECF8E]" />, name: "Supabase", color: "hover:border-[#3ECF8E]" },
      { icon: <FaDatabase className="h-8 w-8 text-[#4479A1]" />, name: "PostgreSQL", color: "hover:border-[#4479A1]" },
    ]
  },
  {
    name: "🤖 Robotique & Mécatronique",
    technologies: [
      { icon: <SiArduino className="h-8 w-8 text-[#00979C]" />, name: "Arduino", color: "hover:border-[#00979C]" },
      { icon: <SiRaspberrypi className="h-8 w-8 text-[#A22846]" />, name: "Raspberry Pi", color: "hover:border-[#A22846]" },
      { icon: <SiEspressif className="h-8 w-8 text-[#E7352C]" />, name: "ESP32/8266", color: "hover:border-[#E7352C]" },
      { icon: <GiCpu className="h-8 w-8 text-[#6C5CE7]" />, name: "Microcontrôleurs", color: "hover:border-[#6C5CE7]" },
      { icon: <FaMicrochip className="h-8 w-8 text-[#0984E3]" />, name: "PCB Design", color: "hover:border-[#0984E3]" },
      { icon: <FaRobot className="h-8 w-8 text-[#00B894]" />, name: "Robotique", color: "hover:border-[#00B894]" },
      { icon: <FaCogs className="h-8 w-8 text-[#E17055]" />, name: "Mécatronique", color: "hover:border-[#E17055]" },
      { icon: <GiGears className="h-8 w-8 text-[#FDCB6E]" />, name: "Automatisation", color: "hover:border-[#FDCB6E]" },
    ]
  },
  {
    name: "⚡ Électronique & Énergie",
    technologies: [
      { icon: <FaBolt className="h-8 w-8 text-[#FDCB6E]" />, name: "Électronique", color: "hover:border-[#FDCB6E]" },
      { icon: <GiCircuitry className="h-8 w-8 text-[#00CEC9]" />, name: "Circuitry", color: "hover:border-[#00CEC9]" },
      { icon: <GiSolarPower className="h-8 w-8 text-[#F97F51]" />, name: "Solaire", color: "hover:border-[#F97F51]" },
      { icon: <GiBoltShield className="h-8 w-8 text-[#EAB543]" />, name: "Systèmes électriques", color: "hover:border-[#EAB543]" },
      { icon: <FaWifi className="h-8 w-8 text-[#0984E3]" />, name: "IoT & Capteurs", color: "hover:border-[#0984E3]" },
      { icon: <SiMqtt className="h-8 w-8 text-[#660066]" />, name: "MQTT", color: "hover:border-[#660066]" },
      { icon: <SiInfluxdb className="h-8 w-8 text-[#22ADF6]" />, name: "InfluxDB", color: "hover:border-[#22ADF6]" },
      { icon: <FaArrowsAltH className="h-8 w-8 text-[#6C5CE7]" />, name: "SCADA", color: "hover:border-[#6C5CE7]" },
    ]
  },
  {
    name: "🧠 Intelligence Artificielle & Data",
    technologies: [
      { icon: <FaPython className="h-8 w-8 text-[#3776AB]" />, name: "Python", color: "hover:border-[#3776AB]" },
      { icon: <SiTensorflow className="h-8 w-8 text-[#FF6F00]" />, name: "TensorFlow", color: "hover:border-[#FF6F00]" },
      { icon: <SiHuggingface className="h-8 w-8 text-[#FFD21E]" />, name: "Hugging Face", color: "hover:border-[#FFD21E]" },
      { icon: <SiOpencv className="h-8 w-8 text-[#5C3EE8]" />, name: "OpenCV", color: "hover:border-[#5C3EE8]" },
      { icon: <SiJupyter className="h-8 w-8 text-[#F37626]" />, name: "Jupyter", color: "hover:border-[#F37626]" },
      { icon: <SiNvidia className="h-8 w-8 text-[#76B900]" />, name: "NVIDIA AI", color: "hover:border-[#76B900]" },
      { icon: <FaBrain className="h-8 w-8 text-[#E17055]" />, name: "Deep Learning", color: "hover:border-[#E17055]" },
      { icon: <FaChartLine className="h-8 w-8 text-[#00B894]" />, name: "Data Analytics", color: "hover:border-[#00B894]" },
    ]
  }
];

export default function TechStack() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true }}
        className="text-center"
      >
        <h2 className="text-3xl font-black text-[#1E3A8A] md:text-4xl">
          Notre Stack Technologique
        </h2>
        <p className="mt-2 text-slate-600 max-w-2xl mx-auto">
          Des technologies modernes et robustes pour construire des solutions innovantes,
          du capteur à l'interface utilisateur.
        </p>
      </motion.div>

      <div className="mt-10 space-y-12">
        {techCategories.map((category, catIndex) => (
          <div key={catIndex}>
            <h3 className="text-xl font-bold text-slate-700 mb-4">
              {category.name}
            </h3>
            <div className="relative overflow-hidden">
              <motion.div
                className="flex gap-4 py-2"
                animate={{
                  x: ['0%', '-50%'],
                }}
                transition={{
                  duration: 30,
                  repeat: Infinity,
                  ease: "linear",
                }}
              >
                {/* Double array pour défilement infini */}
                {[...category.technologies, ...category.technologies].map((tech, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ y: -5, scale: 1.1 }}
                    className={`group flex flex-col items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white p-4 w-28 transition-all hover:shadow-xl flex-shrink-0 ${tech.color}`}
                  >
                    <div className="text-4xl">{tech.icon}</div>
                    <span className="text-xs font-medium text-slate-600 group-hover:text-slate-900 text-center">
                      {tech.name}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}