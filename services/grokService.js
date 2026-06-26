const axios = require('axios');
const dotenv = require('dotenv');
const validateJson = require('../utils/validateJson');

dotenv.config();

const apiKey = process.env.GROK_API_KEY;
const apiUrl = process.env.GROK_API_URL || 'https://api.x.ai/v1/chat/completions';
const modelName = process.env.GROK_MODEL || 'grok-2-latest';

class GrokService {
  constructor() {
    this.hasKey = !!apiKey;
  }

  /**
   * Request professional website copy from Grok AI based on input details.
   * 
   * @param {object} businessData - Collected chat details
   * @returns {Promise<object>} Clean, validated JSON website content
   */
  async generateWebsiteContent(businessData) {
    const { name, category, description, services, phone, email, address, designStyle } = businessData;

    if (!apiKey) {
      console.warn('⚠️ GROK_API_KEY not configured. Falling back to Heuristic Copywriting Engine.');
      return this.generateMockContent(businessData);
    }

    const systemPrompt = `Generate professional, premium website content for a small business.
You MUST return ONLY valid JSON. Absolutely no markdown backticks, no explanations, no HTML.
The JSON structure MUST match exactly:
{
  "heroTitle": "Catchy and professional headline",
  "heroSubtitle": "Engaging sub-headline detailing the core value proposition",
  "heroCTA": "Button text like 'Book Now' or 'Get Started'",
  "aboutTitle": "About Our [Business Category]",
  "aboutDescription": "A general description of what the business does and why it is great.",
  "aboutStory": "A deeper story of how the business was founded, its mission, and its dedication to customers.",
  "services": [
    {
      "title": "Service 1 Name",
      "description": "Short service 1 description",
      "iconName": "briefcase"
    },
    {
      "title": "Service 2 Name",
      "description": "Short service 2 description",
      "iconName": "settings"
    },
    {
      "title": "Service 3 Name",
      "description": "Short service 3 description",
      "iconName": "people"
    }
  ],
  "testimonials": [
    {
      "name": "Customer Name",
      "role": "Customer Job/Title",
      "text": "Quote about their positive experience."
    }
  ],
  "faq": [
    {
      "question": "Common customer question?",
      "answer": "Helpful, detailed response."
    }
  ],
  "ctaTitle": "Final Call to Action Headline",
  "ctaText": "Supporting pitch encouraging contact",
  "contactTitle": "Get In Touch",
  "contactSubtitle": "Contact statement",
  "seoTitle": "SEO Page Title",
  "seoDescription": "SEO Page Description"
}`;

    const userPrompt = `Business details:
- Name: ${name}
- Category: ${category}
- Description: ${description}
- Custom Services Provided: ${services || 'Standard services'}
- Phone: ${phone}
- Email: ${email}
- Address: ${address}
- Preferred Vibe/Style: ${designStyle}

Please tailor the voice, copy, services, testimonials, and FAQs exactly to this industry, business details, and preferred style. Return only raw, valid JSON.`;

    try {
      const response = await axios.post(apiUrl, {
        model: modelName,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' }
      }, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 25000 // 25 seconds timeout
      });

      const rawContent = response.data.choices[0].message.content;
      console.log('AI response received.');

      // Parse and validate the response
      let parsed = JSON.parse(this.cleanJsonResponse(rawContent));
      return validateJson(parsed);

    } catch (error) {
      console.error('❌ Grok API error:', error.response ? error.response.data : error.message);
      console.log('Retrying generation once with simplified prompt...');
      
      try {
        // Simple retry
        const retryResponse = await axios.post(apiUrl, {
          model: modelName,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\nGenerate content for:\nBusiness Name: ${name}\nCategory: ${category}\nDescription: ${description}` }
          ],
          temperature: 0.5
        }, {
          headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          timeout: 15000
        });

        const rawContent = retryResponse.data.choices[0].message.content;
        let parsed = JSON.parse(this.cleanJsonResponse(rawContent));
        return validateJson(parsed);
      } catch (retryError) {
        console.error('❌ Grok API retry failed, falling back to mock generator.');
        return this.generateMockContent(businessData);
      }
    }
  }

  /**
   * Cleans AI text output, removing potential markdown wrapping like ```json ... ```
   */
  cleanJsonResponse(text) {
    if (!text) return '{}';
    let cleaned = text.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.substring(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.substring(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
    return cleaned.trim();
  }

  /**
   * Generates localized mock website text copies for development and testing.
   */
  generateMockContent(data) {
    const name = data.name || 'NexSite Merchant';
    const cat = (data.category || 'business').toLowerCase();
    const desc = data.description || 'Professional premium solutions.';
    
    // Choose industry layout template content
    if (cat.includes('coach') || cat.includes('school') || cat.includes('edu') || cat.includes('train')) {
      return validateJson({
        heroTitle: `Empower Your Future with ${name}`,
        heroSubtitle: `Professional, result-oriented coaching programs designed to help you excel academically and professionally.`,
        heroCTA: 'Enroll Now',
        aboutTitle: 'Learn From Expert Educators',
        aboutDescription: `Welcome to ${name}. We specialize in structured interactive lessons, curriculum tutoring, and professional certification preparation. Our methods are centered around personalized attention and comprehensive study resources.`,
        aboutStory: `Founded by a group of passionate educators, we set out to build an environment where learning is engaging, practical, and highly result-oriented. Over the years, we have helped thousands of students crack competitive exams and build successful careers.`,
        services: [
          { title: 'Interactive Masterclasses', description: 'Deep-dive live sessions led by field experts to clarify complex concepts and build solid foundations.', iconName: 'school' },
          { title: 'Personalized Mentorship', description: 'One-on-one study planning, continuous performance reviews, and dedicated doubt-solving assistance.', iconName: 'people' },
          { title: 'Comprehensive Mock Tests', description: 'Real exam simulators, solved past papers, and analytics to track your progress and identify weak spots.', iconName: 'document-text' }
        ],
        testimonials: [
          { name: 'Kunal Verma', role: 'IIT JEE Aspirant', text: 'The personalized guidance at this institute completely transformed my preparation strategy. The faculty is extremely supportive!' },
          { name: 'Ritu Sen', role: 'Software Engineer', text: 'I took the professional certification course. The mock tests and curriculum are perfectly in sync with the actual exam.' }
        ],
        faq: [
          { question: 'What is the batch size for coaching classes?', answer: 'We maintain a small batch size of 20-25 students to ensure personalized attention and active doubt resolution.' },
          { question: 'Do you provide online or offline classes?', answer: 'We offer hybrid learning options, including interactive online live streams and in-person lectures.' },
          { question: 'Is study material included in the fee?', answer: 'Yes, full comprehensive notes, formula guides, and mock test access are completely included in the course fee.' }
        ],
        ctaTitle: 'Take the First Step Toward Academic Success',
        ctaText: `Schedule a free counseling session with our expert teachers today. Let us build a custom roadmap for your career goals.`,
        contactTitle: 'Get In Touch',
        contactSubtitle: 'Fill the form below to book a free demo session.'
      });
    }

    if (cat.includes('clinic') || cat.includes('doc') || cat.includes('health') || cat.includes('med') || cat.includes('dentist')) {
      return validateJson({
        heroTitle: `Your Health, Our Priority at ${name}`,
        heroSubtitle: `Compassionate medical care and advanced diagnostics from experienced doctors, focused on your family's wellness.`,
        heroCTA: 'Book Consultation',
        aboutTitle: 'Providing World-Class Medical Care',
        aboutDescription: `Welcome to ${name}. Our clinic combines state-of-the-art diagnostic technology with specialized medical professionals to offer a holistic healthcare experience. We are committed to preventive health and treatment excellence.`,
        aboutStory: `Established in 2018, our clinic has earned a reputation for clinical integrity and customer satisfaction. We strive to provide a clean, modern, and comforting environment for patients of all ages.`,
        services: [
          { title: 'General Consultations', description: 'Complete general body health checkups, primary care diagnostics, and custom treatment roadmaps.', iconName: 'pulse' },
          { title: 'Specialist Diagnostics', description: 'Advanced internal medicine tests, blood panels, and non-invasive scanning services on-site.', iconName: 'flask' },
          { title: 'Preventive Screenings', description: 'Wellness counseling, immunization, and regular medical checkups to detect health risks early.', iconName: 'shield' }
        ],
        testimonials: [
          { name: 'Dr. Sameer Joshi', role: 'Patient', text: 'The staff is highly professional and the clinic is spotless. The doctor took the time to answer all my health queries patiently.' },
          { name: 'Megha Nair', role: 'Homemaker', text: 'Booking appointments is so simple. We always get our lab results on time and online consultation options are highly convenient!' }
        ],
        faq: [
          { question: 'What are your clinic working hours?', answer: 'Our clinic is open Monday through Saturday, from 8:00 AM to 8:00 PM. Emergency services are available on call.' },
          { question: 'Do you accept health insurance policies?', answer: 'Yes, we are partnered with all major health insurance providers. Please contact our front desk to verify your specific policy.' },
          { question: 'How can I book an appointment?', answer: 'You can book an appointment online via this website, click the WhatsApp chat button, or call our front desk directly.' }
        ],
        ctaTitle: 'Ensure Peace of Mind for Your Family Today',
        ctaText: `Schedule a diagnostic screen or routine health checkup with our specialist doctors today. Health is wealth!`,
        contactTitle: 'Contact Our Clinic',
        contactSubtitle: 'Drop your details below to schedule an appointment call.'
      });
    }

    if (cat.includes('gym') || cat.includes('fit') || cat.includes('yoga') || cat.includes('crossfit') || cat.includes('train')) {
      return validateJson({
        heroTitle: `Unleash Your Inner Strength with ${name}`,
        heroSubtitle: `Transform your body, mind, and health in our premium fitness studio equipped with elite training gear and expert coaches.`,
        heroCTA: 'Start Free Trial',
        aboutTitle: 'Redefine Your Fitness Limits',
        aboutDescription: `At ${name}, we believe fitness is a lifestyle. Our high-energy training classes, personalized nutrition planning, and supportive workout community will keep you motivated to smash your fitness goals.`,
        aboutStory: `We started as a small local gym with a simple mission: to build a fitness sanctuary where anyone, from beginners to elite athletes, feels empowered. Today, we stand as the region's leading fitness hub.`,
        services: [
          { title: 'Personal Strength Coaching', description: 'Tailored workout routines, form correction, and progressive weight-lifting guidance from certified coaches.', iconName: 'fitness' },
          { title: 'High-Intensity Group Cardio', description: 'Dynamic group workouts, CrossFit, HIIT, and spinning sessions built to burn calories and increase stamina.', iconName: 'flash' },
          { title: 'Custom Diet & Nutrition Plans', description: 'Detailed diet plans, macronutrient breakdowns, and weekly weight checks to align with your body goals.', iconName: 'nutrition' }
        ],
        testimonials: [
          { name: 'Aditya Sen', role: 'Member (Lost 15kg)', text: 'The atmosphere is unmatched! The trainers push you to do your best, and the equipment is state-of-the-art.' },
          { name: 'Priya Roy', role: 'Yoga Practitioner', text: 'I love the hybrid gym & yoga classes. It has helped me increase my flexibility and mental clarity significantly.' }
        ],
        faq: [
          { question: 'Are lockers and showers available?', answer: 'Yes, we offer complimentary clean lockers, private showers, and steam room facilities for all active members.' },
          { question: 'Do you offer a trial membership?', answer: 'Absolutely! We offer a free 3-day guest pass so you can experience our gym before choosing a subscription plan.' },
          { question: 'Can I pause my gym membership?', answer: 'Yes, premium members can pause their subscriptions for up to 30 days per calendar year in case of travel or medical reasons.' }
        ],
        ctaTitle: 'Stop Wishing. Start Doing. Join Us Today!',
        ctaText: `No matter your fitness level, we have a plan for you. Claim your free trial pass and let's sweat together.`,
        contactTitle: 'Join the Fitness Crew',
        contactSubtitle: 'Enter your details below and a trainer will call you for a free assessment.'
      });
    }

    if (cat.includes('rest') || cat.includes('cafe') || cat.includes('food') || cat.includes('bist') || cat.includes('bakery')) {
      return validateJson({
        heroTitle: `A Symphony of Flavors at ${name}`,
        heroSubtitle: `Experience exquisite culinary craftsmanship, fresh locally-sourced ingredients, and a warm, inviting dining ambiance.`,
        heroCTA: 'Book a Table',
        aboutTitle: 'Crafting Memories Through Food',
        aboutDescription: `Welcome to ${name}. We take pride in serving delicious, freshly prepared dishes inspired by global and local cuisines. Every plate is crafted with care, combining unique spices and culinary techniques.`,
        aboutStory: `Our culinary journey began with a love for family cooking. We opened our doors to share these traditional recipes, refined with modern culinary twists, with our beloved local food enthusiasts.`,
        services: [
          { title: 'Gourmet Dine-in Experience', description: 'Enjoy our beautifully styled seating, candlelight dining, and exceptional customer service.', iconName: 'restaurant' },
          { title: 'Private Event Catering', description: 'Custom menus, food styling, and professional serving crews for weddings, corporate meets, and birthdays.', iconName: 'beer' },
          { title: 'Express Home Delivery', description: 'Order online and get piping-hot, fresh food delivered securely to your doorstep within 30 minutes.', iconName: 'bicycle' }
        ],
        testimonials: [
          { name: 'Vikram Seth', role: 'Food Critic', text: 'The signature chef dishes are absolutely mind-blowing. The balance of flavors is perfection, and the service is highly prompt.' },
          { name: 'Kriti Deshmukh', role: 'Regular Patron', text: 'Our favorite family dinner spot. The menu has options for everyone, and the rustic aesthetic makes it great for photos!' }
        ],
        faq: [
          { question: 'Do you offer vegan and gluten-free options?', answer: 'Yes, we have a dedicated section on our menu containing healthy, organic, vegan, and gluten-free preparations.' },
          { question: 'Is table reservation mandatory for dine-in?', answer: 'No, but we highly recommend reserving a table for weekend dinners to avoid waiting queues.' },
          { question: 'Do you charge a service tax fee?', answer: 'No, we do not apply service charges. All tips go directly to our hard-working kitchen and waiting staff.' }
        ],
        ctaTitle: 'Indulge in a Memorable Dining Experience',
        ctaText: `Treat your taste buds today. Reserve your table or order online to enjoy chef-crafted delicacies in the comfort of your home.`,
        contactTitle: 'Reserve Your Table',
        contactSubtitle: 'Provide your name and count to reserve a table instantly.'
      });
    }

    // Default: Business / Corporate Agency
    return validateJson({
      heroTitle: `Grow Your Business with ${name}`,
      heroSubtitle: `Empowering small and mid-sized enterprises with digital innovation, data-driven consulting, and growth strategies.`,
      heroCTA: 'Get Free Proposal',
      aboutTitle: 'Driven by Results, Focused on Success',
      aboutDescription: `At ${name}, we partner with ambitious brands to transform their digital operations, optimize conversion pipelines, and scale online customer acquisition using proven methodologies.`,
      aboutStory: `We are a collective of developers, marketing strategists, and business analysts who believe that every brand deserves a world-class digital storefront. For 5+ years, we have helped businesses scale and automate operations.`,
      services: [
        { title: 'Digital Brand Strategy', description: 'Complete market audit, competitor analysis, and multi-channel marketing campaigns built to scale leads.', iconName: 'trending-up' },
        { title: 'Custom Web Engineering', description: 'Blazing-fast, SEO-optimized, and premium designed web platforms tailored to convert visitors into clients.', iconName: 'code-working' },
        { title: 'Business Process Automation', description: 'Integrating modern CRM, lead-tracking tools, and automated email drips to cut down manual admin hours.', iconName: 'cog' }
      ],
      testimonials: [
        { name: 'Sanjay Dutt', role: 'CEO, Dutt Logisitics', text: 'Their consulting team restructured our lead intake forms, resulting in a 40% jump in qualified quote requests in just two months.' },
        { name: 'Tara Mehta', role: 'Marketing Lead, Zest Retail', text: 'The automation pipelines they implemented saved us 15+ hours of manual database sorting per week. Truly a game changer!' }
      ],
      faq: [
        { question: 'How long does a typical web project take?', answer: 'Standard web platforms take 2-4 weeks from initial wireframe planning to public deployment and launch.' },
        { question: 'Do you provide maintenance and updates?', answer: 'Yes, we offer monthly support packages including security patches, content updates, and server speed checks.' },
        { question: 'What billing models do you support?', answer: 'We offer flexible project-based pricing or monthly retainer contracts depending on your business requirements.' }
      ],
      ctaTitle: 'Scale Your Business to the Next Level',
      ctaText: `Schedule a 15-minute diagnostic call with our senior consultants today. We will audit your current setup and provide a free action list.`,
      contactTitle: 'Request a Free Proposal',
      contactSubtitle: 'Drop your details and project details, and our strategy team will reach out in 24 hours.'
    });
  }
}

module.exports = new GrokService();
