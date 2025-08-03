import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bot, Target, Zap, BarChart3, TrendingUp, Shield } from "lucide-react";

const TradingFeatures = () => {
  const features = [
    {
      icon: BarChart3,
      title: "Spot Trading",
      description: "Trade cryptocurrencies instantly with professional charting tools and advanced order types.",
      features: ["Advanced charts", "Multiple order types", "Low fees 0.1%"],
      badge: "Popular",
      badgeColor: "gain"
    },
    {
      icon: TrendingUp,
      title: "Futures Trading",
      description: "Leverage your positions up to 125x with professional risk management tools and cross margin.",
      features: ["Up to 125x leverage", "Cross & isolated margin", "Risk controls"],
      badge: "Pro",
      badgeColor: "crypto-blue"
    },
    {
      icon: Target,
      title: "Options Trading",
      description: "Trade European and American options with flexible strategies and automated execution.",
      features: ["Call & put options", "Custom strategies", "Auto exercise"],
      badge: "New",
      badgeColor: "accent"
    },
    {
      icon: Bot,
      title: "Trading Bots",
      description: "Automate your trading strategies with AI-powered bots, backtesting, and performance analytics.",
      features: ["Grid trading", "DCA strategies", "AI signals"],
      badge: "AI",
      badgeColor: "crypto-purple"
    },
    {
      icon: Zap,
      title: "Binary Options",
      description: "Simple binary trading with predetermined payouts and ultra-fast execution times.",
      features: ["1-minute trades", "Fixed payouts", "Simple interface"],
      badge: "Fast",
      badgeColor: "crypto-red"
    },
    {
      icon: Shield,
      title: "Quant Trading",
      description: "Professional algorithmic trading with advanced analytics, backtesting, and custom strategies.",
      features: ["Custom algorithms", "Backtesting", "Performance analytics"],
      badge: "Enterprise",
      badgeColor: "accent"
    }
  ];

  return (
    <section className="section-professional relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-secondary/10"></div>
      
      <div className="container-professional relative">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge className="bg-gain/10 text-gain border-crypto-green/20 mb-4 px-4 py-2">
            Trading Solutions
          </Badge>
          <h2 className="text-4xl lg:text-5xl heading-professional mb-6">
            <span className="text-gradient-crypto">Professional Trading</span>
            <br />
            for Every Strategy
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-professional">
            From spot trading to automated strategies, access institutional-grade tools 
            designed for traders of all experience levels.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="card-professional p-8 group cursor-pointer">
                {/* Header */}
                <div className="flex items-start justify-between mb-6">
                  <div className={`w-14 h-14 rounded-xl bg-${feature.badgeColor}/10 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-7 h-7 text-${feature.badgeColor}`} />
                  </div>
                  <Badge className={`bg-${feature.badgeColor}/10 text-${feature.badgeColor} border-${feature.badgeColor}/20`}>
                    {feature.badge}
                  </Badge>
                </div>

                {/* Content */}
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-foreground heading-professional">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed text-professional">
                    {feature.description}
                  </p>

                  {/* Feature List */}
                  <ul className="space-y-3">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm">
                        <div className={`w-1.5 h-1.5 rounded-full bg-${feature.badgeColor} mr-3`}></div>
                        <span className="text-muted-foreground text-professional">{item}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <Button 
                    variant="outline" 
                    className="w-full mt-6 btn-professional-secondary group-hover:border-primary group-hover:text-primary"
                  >
                    Learn More
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA Section */}
        <div className="text-center card-professional p-12 rounded-2xl">
          <h3 className="text-2xl heading-professional mb-4">Ready to Start Trading?</h3>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto text-professional">
            Join millions of traders who trust Kryvex for their crypto trading needs. 
            Start with any amount and scale your portfolio with professional tools.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-professional-primary px-8 py-4">
              <TrendingUp className="w-5 h-5 mr-2" />
              Start Trading Today
            </Button>
            <Button size="lg" variant="outline" className="btn-professional-secondary px-8 py-4">
              View Demo Account
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-6 text-professional">
            No minimum deposit • Start with any amount • 24/7 professional support
          </p>
        </div>
      </div>
    </section>
  );
};

export default TradingFeatures;