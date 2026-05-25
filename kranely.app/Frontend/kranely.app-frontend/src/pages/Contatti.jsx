import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import SEO from '../components/seo/SEO';
import { sanitizeInput, validateEmail, validateLength } from '../lib/security';
import { useTranslation } from 'react-i18next';
import { Mail, Phone, Clock, Send, Check, MessageSquare, Globe } from 'lucide-react';

const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;

const contactInfo = [
  {
    icon: Mail,
    label: 'Email',
    value: 'info@kranely.com',
    href: 'mailto:info@kranely.com',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+39 000 000 0000',
    href: 'tel:+390000000000',
  },
  {
    icon: Clock,
    label: 'Support hours',
    value: 'Mon – Fri, 9:00 – 18:00 CET',
    href: null,
  },
  {
    icon: Globe,
    label: 'Website',
    value: 'app.kranely.com',
    href: 'https://app.kranely.com',
  },
];

export default function Contatti() {
  const { t } = useTranslation();
  const [form, setForm] = useState({ name: '', email: '', company: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);
  const rateLimitRef = useRef({ count: 0, windowStart: 0 });

  const set = (field) => (e) => setForm((p) => ({ ...p, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    const now = Date.now();
    const rl = rateLimitRef.current;
    if (now - rl.windowStart > RATE_LIMIT_WINDOW_MS) {
      rl.count = 0;
      rl.windowStart = now;
    }
    if (rl.count >= RATE_LIMIT_MAX) {
      setError('Too many submissions. Please wait a few minutes before trying again.');
      return;
    }
    rl.count += 1;

    const name = sanitizeInput(form.name.trim(), 100);
    const email = sanitizeInput(form.email.trim(), 254);
    const company = sanitizeInput(form.company.trim(), 100);
    const message = sanitizeInput(form.message.trim(), 2000);

    if (!validateLength(name, 2, 100)) {
      setError('Please enter your full name (2-100 characters).');
      return;
    }
    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validateLength(message, 10, 2000)) {
      setError('Message must be between 10 and 2000 characters.');
      return;
    }

    setSending(true);
    try {
      const mailto = `mailto:info@kranely.com?subject=${encodeURIComponent(`Contact from ${name}`)}&body=${encodeURIComponent(`Name: ${name}\nEmail: ${email}\nCompany: ${company}\n\n${message}`)}`;
      window.location.href = mailto;
      setSent(true);
    } catch {
      setError('Something went wrong. Write to us directly at info@kranely.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-[#1C1A18]">
      <SEO
        title="Contact Kranely | Window & Door Management Platform"
        description="Get in touch with the Kranely team. Questions about pricing, onboarding, or features — we're here to help."
        keywords="contact Kranely, kranely support, window installer software demo"
      />

      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:48px_48px]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FFC703]/6 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FFC703]/10 border border-[#FFC703]/20 text-[#FFC703] text-sm mb-8"
          >
            <MessageSquare size={14} />
            Contact us
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-bold text-white mb-5 tracking-tight"
          >
            Let&apos;s talk about your{' '}
            <span className="text-[#FFC703]">business.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-[#F0EBE8]/55 max-w-2xl mx-auto font-light"
          >
            Whether you need a demo, have a question, or want to explore a custom enterprise plan — we&apos;re here.
          </motion.p>
        </div>
      </section>

      <section className="py-16 pb-32">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-2 space-y-6"
            >
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-6">
                {contactInfo.map((item, i) => (
                  <div key={i} className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[#FFC703]/10 flex items-center justify-center text-[#FFC703] flex-shrink-0">
                      <item.icon size={18} />
                    </div>
                    <div>
                      <div className="text-xs text-[#F0EBE8]/40 uppercase tracking-wider mb-0.5">{item.label}</div>
                      {item.href ? (
                        <a href={item.href} className="text-sm text-[#F0EBE8]/80 hover:text-[#FFC703] transition-colors">
                          {item.value}
                        </a>
                      ) : (
                        <div className="text-sm text-[#F0EBE8]/80">{item.value}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-6 rounded-2xl bg-[#FFC703]/8 border border-[#FFC703]/15">
                <div className="text-sm font-semibold text-[#FFC703] mb-2">Need immediate help?</div>
                <div className="text-sm text-[#F0EBE8]/60 leading-relaxed">
                  Check our documentation or open a support ticket directly from your Kranely workspace.
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="lg:col-span-3"
            >
              {sent ? (
                <div className="h-full flex items-center justify-center p-12 rounded-2xl bg-white/5 border border-white/10 text-center">
                  <div>
                    <div className="w-16 h-16 rounded-full bg-[#FFC703]/15 flex items-center justify-center mx-auto mb-5">
                      <Check size={28} className="text-[#FFC703]" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Message sent!</h3>
                    <p className="text-[#F0EBE8]/50 text-sm mb-6">We will reply within one business day.</p>
                    <button
                      onClick={() => { setSent(false); setForm({ name: '', email: '', company: '', message: '' }); }}
                      className="text-sm text-[#FFC703] hover:text-[#FFC703]/80 transition-colors"
                    >
                      Send another message
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-8 rounded-2xl bg-white/5 border border-white/10 space-y-5">
                  <h2 className="text-xl font-bold text-white mb-1">Send us a message</h2>
                  <p className="text-sm text-[#F0EBE8]/45 mb-2">We reply within one business day.</p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-[#F0EBE8]/60 text-xs uppercase tracking-wider">Full name *</Label>
                      <Input
                        value={form.name}
                        onChange={set('name')}
                        required
                        placeholder="John Doe"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FFC703]/40 focus:ring-[#FFC703]/20 rounded-xl"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#F0EBE8]/60 text-xs uppercase tracking-wider">Company</Label>
                      <Input
                        value={form.company}
                        onChange={set('company')}
                        placeholder="ABC Windows"
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FFC703]/40 focus:ring-[#FFC703]/20 rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[#F0EBE8]/60 text-xs uppercase tracking-wider">Email *</Label>
                    <Input
                      type="email"
                      value={form.email}
                      onChange={set('email')}
                      required
                      placeholder="john@company.com"
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FFC703]/40 focus:ring-[#FFC703]/20 rounded-xl"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[#F0EBE8]/60 text-xs uppercase tracking-wider">Message *</Label>
                    <Textarea
                      value={form.message}
                      onChange={set('message')}
                      required
                      placeholder="Tell us what you need..."
                      rows={5}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-[#FFC703]/40 focus:ring-[#FFC703]/20 rounded-xl resize-none"
                    />
                  </div>

                  {error && <p className="text-red-400 text-sm">{error}</p>}

                  <button
                    type="submit"
                    disabled={sending}
                    className="w-full py-3.5 bg-[#FFC703] text-[#1C1A18] rounded-xl font-bold flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-50 transition-all"
                  >
                    <Send size={16} />
                    {sending ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  );
}