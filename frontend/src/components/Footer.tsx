import { TrendingUp, Twitter, Github, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-card border-t border-border-professional py-16 px-6">
      <div className="container-professional">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-crypto-green to-crypto-gold flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-gradient-crypto">Kryvex</span>
            </div>
            <p className="text-muted-foreground max-w-xs text-professional">
              The world's most trusted cryptocurrency trading platform with professional-grade tools for institutional and retail traders.
            </p>
            <div className="flex space-x-4">
              <Twitter className="w-5 h-5 text-muted-foreground hover:text-crypto-blue cursor-pointer transition-colors" />
              <Github className="w-5 h-5 text-muted-foreground hover:text-foreground cursor-pointer transition-colors" />
              <Linkedin className="w-5 h-5 text-muted-foreground hover:text-crypto-blue cursor-pointer transition-colors" />
              <Mail className="w-5 h-5 text-muted-foreground hover:text-gain cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Trading */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 heading-professional">Trading</h3>
            <ul className="space-y-3 text-sm text-muted-foreground text-professional">
              <li><a href="#" className="hover:text-gain transition-colors">Spot Trading</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Futures</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Options</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Binary Options</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Trading Bots</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Quant Trading</a></li>
            </ul>
          </div>

          {/* Earn */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 heading-professional">Earn</h3>
            <ul className="space-y-3 text-sm text-muted-foreground text-professional">
              <li><a href="#" className="hover:text-gain transition-colors">Staking</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Node Stacking</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Yield Farming</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Liquidity Mining</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Savings</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold text-foreground mb-4 heading-professional">Company</h3>
            <ul className="space-y-3 text-sm text-muted-foreground text-professional">
              <li><a href="#" className="hover:text-gain transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Security</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-gain transition-colors">Support</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-border-professional flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-muted-foreground text-professional">
            © 2024 Kryvex. All rights reserved.
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0 text-sm text-muted-foreground text-professional">
            <span>Risk Warning</span>
            <span>•</span>
            <span>Regulatory Compliance</span>
            <span>•</span>
            <span>Cookie Policy</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;