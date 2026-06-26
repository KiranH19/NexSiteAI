/**
 * Validates and repairs the generated JSON content from the AI.
 * Ensures all required fields exist. If any are missing, injects default values.
 * 
 * @param {object} json - The parsed JSON object to validate
 * @returns {object} The validated (and possibly repaired) JSON object
 */
function validateJson(json) {
  const validated = {};

  // Standard string fields
  validated.heroTitle = typeof json.heroTitle === 'string' ? json.heroTitle.trim() : 'Premium Business Solutions';
  validated.heroSubtitle = typeof json.heroSubtitle === 'string' ? json.heroSubtitle.trim() : 'We help you grow your business and reach more customers with cutting-edge strategies.';
  validated.heroCTA = typeof json.heroCTA === 'string' ? json.heroCTA.trim() : 'Get Started';
  
  validated.aboutTitle = typeof json.aboutTitle === 'string' ? json.aboutTitle.trim() : 'About Our Business';
  validated.aboutDescription = typeof json.aboutDescription === 'string' ? json.aboutDescription.trim() : 'We are dedicated to delivering top-tier services to our clients. With years of industry expertise, we build solutions tailored to your unique requirements.';
  validated.aboutStory = typeof json.aboutStory === 'string' ? json.aboutStory.trim() : 'Established with a vision to innovate, we have consistently pushed boundaries to offer exceptional customer satisfaction and build lasting relationships.';

  // Services array (at least 1 service required)
  validated.services = Array.isArray(json.services) ? json.services.map(s => ({
    title: typeof s.title === 'string' ? s.title.trim() : 'General Service',
    description: typeof s.description === 'string' ? s.description.trim() : 'High-quality business service designed to suit your needs.',
    iconName: typeof s.iconName === 'string' ? s.iconName.trim() : 'briefcase'
  })) : [
    { title: 'Quality Consultation', description: 'Expert advice to streamline your workflows and scale growth.', iconName: 'chatbubbles' },
    { title: 'Tailored Execution', description: 'Hands-on execution of custom business goals with proven benchmarks.', iconName: 'settings' },
    { title: '24/7 Support', description: 'Constant support and troubleshooting to ensure seamless operations.', iconName: 'help-circle' }
  ];

  // Testimonials array
  validated.testimonials = Array.isArray(json.testimonials) ? json.testimonials.map(t => ({
    name: typeof t.name === 'string' ? t.name.trim() : 'John Doe',
    role: typeof t.role === 'string' ? t.role.trim() : 'Business Owner',
    text: typeof t.text === 'string' ? t.text.trim() : 'Excellent service and incredible professionalism. Highly recommended!'
  })) : [
    { name: 'Rohan Sharma', role: 'Founder, TechStart', text: 'NexSite helped us launch our online presence in minutes. The website template is gorgeous and converts leads very effectively!' },
    { name: 'Ananya Iyer', role: 'Owner, Bloom Salon', text: 'Our customers love the WhatsApp integration. Leads drop directly into our dashboard and we can close bookings instantly.' }
  ];

  // FAQ array (at least 1 FAQ required)
  validated.faq = Array.isArray(json.faq) ? json.faq.map(f => ({
    question: typeof f.question === 'string' ? f.question.trim() : 'How can I get started?',
    answer: typeof f.answer === 'string' ? f.answer.trim() : 'You can contact us via our phone, email, or using the contact form below.'
  })) : [
    { question: 'What services do you offer?', answer: 'We offer a wide range of services custom tailored to your business needs, which you can see in the services section above.' },
    { question: 'How do I contact support?', answer: 'You can reach out using our contact form or chat with us directly via the WhatsApp button.' },
    { question: 'Are there any setup fees?', answer: 'No, we believe in transparent pricing with no hidden charges.' }
  ];

  // CTA Section
  validated.ctaTitle = typeof json.ctaTitle === 'string' ? json.ctaTitle.trim() : 'Ready to Grow Your Business?';
  validated.ctaText = typeof json.ctaText === 'string' ? json.ctaText.trim() : 'Get in touch with us today for a free consultation and let us transform your digital presence.';
  
  // Contact details
  validated.contactTitle = typeof json.contactTitle === 'string' ? json.contactTitle.trim() : 'Contact Us';
  validated.contactSubtitle = typeof json.contactSubtitle === 'string' ? json.contactSubtitle.trim() : 'Have questions or want to collaborate? Fill out the form or reach us via our official details.';

  // SEO details
  validated.seoTitle = typeof json.seoTitle === 'string' ? json.seoTitle.trim() : validated.heroTitle;
  validated.seoDescription = typeof json.seoDescription === 'string' ? json.seoDescription.trim() : validated.heroSubtitle;

  return validated;
}

module.exports = validateJson;
