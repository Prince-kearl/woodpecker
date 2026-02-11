import { motion } from "framer-motion";
import { Brain, ArrowRight, FileText, Layers, MessageSquare, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: FileText,
    title: "Multi-Format Ingestion",
    description: "PDF, DOCX, EPUB, spreadsheets, and websites - all in one place.",
  },
  {
    icon: Layers,
    title: "Modular Workspaces",
    description: "Create unlimited workspaces that share your knowledge sources.",
  },
  {
    icon: MessageSquare,
    title: "Intelligent Responses",
    description: "Get accurate answers with source citations and context.",
  },
  {
    icon: Zap,
    title: "Multiple Modes",
    description: "Study helper, exam prep, info retrieval, or institutional knowledge.",
  },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-lg text-foreground">Woodpecker</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-glow)' }} />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8"
            >
              <Zap className="w-4 h-4 text-primary" />
              <span className="text-sm text-muted-foreground">Powered by Advanced RAG Technology</span>
            </motion.div>

            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6 leading-tight">
              Your Knowledge,{" "}
              <span className="gradient-text">Supercharged</span>
            </h1>
            
            <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
              Create intelligent AI assistants from your documents, books, and websites. 
              Upload once, use everywhere across unlimited workspaces.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/signup">
                <Button variant="glow" size="xl">
                  Start Building Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/login">
                <Button variant="glass" size="xl">
                  View Demo
                </Button>
              </Link>
            </div>
          </motion.div>

          {/* Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10 pointer-events-none" />
            <div className="glass rounded-2xl p-2 shadow-2xl mx-auto max-w-5xl">
              <div className="bg-card rounded-xl overflow-hidden">
                {/* Mock Dashboard */}
                <div className="flex h-[400px]">
                  {/* Sidebar */}
                  <div className="w-48 bg-sidebar border-r border-sidebar-border p-4">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <Brain className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <span className="font-semibold text-sm text-foreground">Woodpecker</span>
                    </div>
                    <div className="space-y-2">
                      {["Dashboard", "Workspaces", "Knowledge", "Settings"].map((item, i) => (
                        <div 
                          key={item}
                          className={`px-3 py-2 rounded-lg text-sm ${i === 0 ? "bg-sidebar-accent text-primary" : "text-muted-foreground"}`}
                        >
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Main Content */}
                  <div className="flex-1 p-6">
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      {[
                        { label: "Workspaces", value: "5" },
                        { label: "Sources", value: "23" },
                        { label: "Queries", value: "1.2k" },
                      ].map((stat) => (
                        <div key={stat.label} className="glass rounded-xl p-4">
                          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                          <p className="text-sm text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="space-y-3">
                      {["ML Research Papers", "Company Policies", "CS201 Exam Prep"].map((ws, i) => (
                        <div key={ws} className="glass rounded-xl p-4 flex items-center gap-4">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: ["#00d4aa", "#ec4899", "#a855f7"][i] }}
                          />
                          <span className="text-sm font-medium text-foreground">{ws}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need for RAG
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A complete platform for building, managing, and querying your knowledge bases.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="glass rounded-xl p-6 hover:border-primary/30 transition-colors group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:glow transition-shadow">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 border-t border-border">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="glass rounded-3xl p-12 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0" style={{ backgroundImage: 'var(--gradient-glow)' }} />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Ready to Transform Your Knowledge?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Start building intelligent AI assistants today. No credit card required.
              </p>
              <Link to="/signup">
                <Button variant="glow" size="xl">
                  Get Started Free
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-foreground">Woodpecker</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Woodpecker. Built with ❤️ for knowledge seekers.
          </p>
        </div>
      </footer>
    </div>
  );
}
