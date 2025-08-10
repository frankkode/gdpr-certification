import React, { useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Shield, Users, Award, Globe, Lock, Zap, 
  CheckCircle, Star, TrendingUp, Clock, 
  Mail, Phone, MapPin, Github, Linkedin,
  ArrowRight, Play, Download, Eye
} from 'lucide-react';

interface MarketingHomepageProps {
  onGetStarted: () => void;
  onLogin: () => void;
  onRegister: () => void;
}

const MarketingHomepage: React.FC<MarketingHomepageProps> = ({ 
  onGetStarted, 
  onLogin, 
  onRegister 
}) => {
  const { t } = useTranslation();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 300], [0, 100]);
  const y2 = useTransform(scrollY, [0, 300], [0, -100]);

  const [stats, setStats] = useState({
    certificatesGenerated: 10429,
    organizationsServed: 847,
    countriesReached: 67,
    uptimePercentage: 99.9
  });

  const features = [
    {
      icon: Shield,
      title: 'GDPR Compliant',
      description: 'Built with privacy by design. Zero personal data storage, full GDPR compliance.',
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-400/30'
    },
    {
      icon: Lock,
      title: 'Military-Grade Security',
      description: 'SHA-512 cryptographic hashing with tamper-proof verification.',
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-400/30'
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate and verify certificates in under 3 seconds.',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-400/30'
    },
    {
      icon: Globe,
      title: 'Global Reach',
      description: 'Multi-language support with worldwide accessibility.',
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-400/30'
    },
    {
      icon: Users,
      title: 'Bulk Generation',
      description: 'Generate thousands of certificates with CSV upload.',
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-400/30'
    },
    {
      icon: Award,
      title: 'Professional Templates',
      description: 'Beautiful, customizable certificate templates.',
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/10',
      borderColor: 'border-pink-400/30'
    }
  ];

  const pricingPlans = [
    {
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for individuals',
      features: [
        '1 certificate/month',
        'Basic templates only',
        'No customization',
        'GDPR compliant',
        'Basic verification'
      ],
      cta: 'Get Started',
      popular: false,
      color: 'border-gray-600'
    },
    {
      name: 'Professional',
      price: '$29',
      period: 'month',
      description: 'For small businesses',
      features: [
        '5 certificates/month',
        'Template customization',
        'Logo & signature upload',
        'Email support',
        'Custom branding',
        'GDPR compliant'
      ],
      cta: 'Start Free Trial',
      popular: true,
      color: 'border-green-400'
    },
    {
      name: 'Premium',
      price: '€99',
      period: 'month',
      description: 'For growing businesses',
      features: [
        '30 certificates/month',
        'Priority templates',
        'Advanced customization',
        'Priority support',
        'Analytics dashboard',
        'Bulk generation'
      ],
      cta: 'Upgrade Now',
      popular: false,
      color: 'border-blue-400'
    },
    {
      name: 'Enterprise',
      price: '€499',
      period: 'month',
      description: 'For large organizations',
      features: [
        '100 certificates/month',
        'Unlimited templates',
        'API access',
        'Dedicated support',
        'White-label solution',
        'Advanced analytics',
        'SSO integration'
      ],
      cta: 'Contact Sales',
      popular: false,
      color: 'border-blue-400'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'HR Director',
      company: 'TechCorp',
      avatar: '👩‍💼',
      quote: 'This system has revolutionized our certificate management. The GDPR compliance gives us peace of mind.',
      rating: 5
    },
    {
      name: 'Dr. Michael Chen',
      role: 'Training Manager',
      company: 'MedLearn',
      avatar: '👨‍⚕️',
      quote: 'The bulk generation feature saved us hundreds of hours. Highly recommend!',
      rating: 5
    },
    {
      name: 'Emma Rodriguez',
      role: 'Operations Lead',
      company: 'EduTech',
      avatar: '👩‍🎓',
      quote: 'Professional templates and lightning-fast verification. Exactly what we needed.',
      rating: 5
    }
  ];

  const checkCertificateLimit = (user: { certificate_count_current_month: number; certificate_limit_per_month: number }) => {
    if (user.certificate_count_current_month >= user.certificate_limit_per_month) {
      return { 
        canGenerate: false, 
        reason: `Monthly certificate limit reached (${user.certificate_limit_per_month}). Please upgrade your plan.`,
        currentUsage: user.certificate_count_current_month,
        limit: user.certificate_limit_per_month
      };
    }
    return { canGenerate: true };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold text-white">CertifySecure</span>
            </div>
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-300 hover:text-white transition">Features</a>
              <a href="#pricing" className="text-gray-300 hover:text-white transition">Pricing</a>
              <a href="#testimonials" className="text-gray-300 hover:text-white transition">Reviews</a>
              <a href="#contact" className="text-gray-300 hover:text-white transition">Contact</a>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onLogin}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition"
              >
                Login
              </button>
              <button
                onClick={onRegister}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <motion.div
          style={{ y: y1 }}
          className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-blue-500/20 blur-3xl"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                <span className="text-green-400">GDPR-Compliant</span><br />
                Certificate Verification<br />
                <span className="text-blue-400">Made Simple</span>
              </h1>
              <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
                Generate, verify, and manage digital certificates with military-grade security 
                and complete privacy compliance. Trusted by organizations worldwide.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12"
            >
              <button
                onClick={onGetStarted}
                className="w-full sm:w-auto px-8 py-4 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 transition transform hover:scale-105"
              >
                <span>Get Started Free</span>
                <ArrowRight className="h-5 w-5" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 border border-white/20 text-white rounded-lg font-semibold text-lg flex items-center justify-center space-x-2 hover:bg-white/5 transition">
                <Play className="h-5 w-5" />
                <span>Watch Demo</span>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto"
            >
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-green-400">
                  {stats.certificatesGenerated.toLocaleString()}+
                </div>
                <div className="text-sm text-gray-400">Certificates Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-blue-400">
                  {stats.organizationsServed}+
                </div>
                <div className="text-sm text-gray-400">Organizations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-purple-400">
                  {stats.countriesReached}+
                </div>
                <div className="text-sm text-gray-400">Countries</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-yellow-400">
                  {stats.uptimePercentage}%
                </div>
                <div className="text-sm text-gray-400">Uptime</div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 relative">
        <motion.div
          style={{ y: y2 }}
          className="absolute inset-0 bg-gradient-to-l from-blue-500/10 to-purple-500/10 blur-3xl"
        />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Why Choose <span className="text-green-400">CertifySecure</span>?
            </h2>
            <p className="text-xl text-gray-300">
              Built with privacy by design and enterprise-grade security
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`p-6 rounded-xl border ${feature.borderColor} ${feature.bgColor} backdrop-blur-md hover:scale-105 transition-transform duration-300`}
              >
                <feature.icon className={`h-12 w-12 ${feature.color} mb-4`} />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Simple, <span className="text-green-400">Transparent</span> Pricing
            </h2>
            <p className="text-xl text-gray-300">
              Choose the plan that fits your organization's needs
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className={`relative p-8 rounded-xl border-2 ${plan.color} bg-white/5 backdrop-blur-md ${
                  plan.popular ? 'scale-105 bg-gradient-to-br from-green-500/10 to-blue-500/10' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-green-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-400 ml-2">/{plan.period}</span>
                  </div>
                  <p className="text-gray-300 mt-2">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-center text-gray-300">
                      <CheckCircle className="h-5 w-5 text-green-400 mr-3 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={plan.name === 'Enterprise' ? () => {} : onGetStarted}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition ${
                    plan.popular
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'border border-white/20 text-white hover:bg-white/5'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Trusted by <span className="text-green-400">Organizations</span> Worldwide
            </h2>
            <p className="text-xl text-gray-300">
              See what our customers have to say about CertifySecure
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-md"
              >
                <div className="flex items-center mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center">
                  <div className="text-3xl mr-3">{testimonial.avatar}</div>
                  <div>
                    <div className="font-semibold text-white">{testimonial.name}</div>
                    <div className="text-sm text-gray-400">{testimonial.role}, {testimonial.company}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-black/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Get in <span className="text-green-400">Touch</span>
              </h2>
              <p className="text-xl text-gray-300">
                Ready to transform your certificate management? We're here to help.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <Mail className="h-6 w-6 text-green-400 mr-4" />
                    <span className="text-gray-300">support@certifysecure.com</span>
                  </div>
                  <div className="flex items-center">
                    <Phone className="h-6 w-6 text-green-400 mr-4" />
                    <span className="text-gray-300">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center">
                    <MapPin className="h-6 w-6 text-green-400 mr-4" />
                    <span className="text-gray-300">San Francisco, CA</span>
                  </div>
                </div>

                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-white mb-4">Follow Us</h4>
                  <div className="flex space-x-4">
                    <a href="#" className="text-gray-400 hover:text-white transition">
                      <Github className="h-6 w-6" />
                    </a>
                    <a href="#" className="text-gray-400 hover:text-white transition">
                      <Linkedin className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>

              <div>
                <form className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Name
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Message
                    </label>
                    <textarea
                      rows={4}
                      className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-green-400 transition resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition"
                  >
                    Send Message
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-3 mb-4 md:mb-0">
              <Shield className="h-8 w-8 text-green-400" />
              <span className="text-xl font-bold text-white">CertifySecure</span>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-400">
                © 2024 CertifySecure. All rights reserved.
              </p>
              <p className="text-sm text-gray-500 mt-1">
                GDPR Compliant • Privacy by Design • Zero Data Retention
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MarketingHomepage;