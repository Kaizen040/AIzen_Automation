// =============================================
// i18n Translation Engine (INLINE VERSION)
// =============================================

const TRANSLATIONS = {
    de: {
        "nav": {
            "services": "Leistungen",
            "process": "Projektablauf",
            "contact": "Kontakt",
            "cta": "Erstgespräch"
        },
        "hero": {
            "title": "Wir bauen <span class=\"highlight shine delay-1\">smarte Systeme</span><br>für Unternehmen, die <span class=\"highlight shine delay-2\">skalieren</span>",
            "subtitle": "KI- & Prozessautomatisierung für nachhaltigen, messbaren Business-Impact",
            "cta": "Erstgespräch buchen"
        },
        "clients": {
            "title": "Unsere Kunden und Partner"
        },
        "benefits": {
            "title": "Ihre Vorteile durch Automatisierung",
            "subtitle": "Messbare Effizienzsteigerung für Ihr Unternehmen",
            "time": {
                "title": "Zeitersparnis",
                "desc": "Automatisierung wiederkehrender Prozesse spart wertvolle Arbeitszeit für strategische Aufgaben"
            },
            "cost": {
                "title": "Kostensenkung",
                "desc": "Reduzierung operativer Kosten durch effiziente Workflow-Optimierung und Fehlerminimierung"
            },
            "scale": {
                "title": "Skalierbarkeit",
                "desc": "Wachsen Sie ohne zusätzliche Ressourcen – unsere Systeme skalieren mit Ihrem Geschäft"
            },
            "accuracy": {
                "title": "Genauigkeit",
                "desc": "KI-gestützte Prozesse eliminieren menschliche Fehler und erhöhen die Datenqualität"
            }
        },
        "services": {
            "title": "Unsere Leistungen",
            "automation": {
                "title": "Intelligente Geschäftsprozessautomatisierung",
                "lead": "Maßgeschneiderte KI-Automatisierung für operative Unternehmensprozesse.",
                "desc": "Wir automatisieren wiederkehrende Abläufe rund um Dokumente, Daten und Systeme – von Angebotserstellung über Excel-Workflows bis zur intelligenten Ordner- und Systemintegration. Individuell entwickelt, skalierbar umgesetzt.",
                "features": [
                    "Dokumentenbasierte KI (RAG)",
                    "CRM & Helpdesk Integration",
                    "Mehrsprachige Agenten"
                ]
            },
            "chatbots": {
                "title": "KI-Chatbots & Knowledge Systems",
                "lead": "Wissen, Support & Kundenkommunikation – automatisiert und präzise",
                "desc": "Vom Website-Chatbot bis zum internen RAG-Wissenssystem: Wir bauen KI, die Informationen versteht, kontextuell beantwortet und direkt mit euren Datenquellen arbeitet.",
                "features": [
                    "Website- & Kundenservice-Chatbots",
                    "RAG-Wissenssysteme für Unternehmen",
                    "Interne FAQ- & Dokumentenassistenten",
                    "Mehrsprachige KI-Kommunikation"
                ]
            },
            "agents": {
                "title": "KI-Agenten & Assistenzsysteme",
                "lead": "Digitale Assistenten für E-Mail, Systeme & tägliche Arbeitsabläufe",
                "desc": "KI-Agenten, die nicht nur antworten – sondern handeln: E-Mails vorbereiten, Aufgaben steuern, Systeme bedienen und Prozesse aktiv vorantreiben.",
                "features": [
                    "Outlook- & E-Mail-Agenten",
                    "Aufgaben- & Termin-Automatisierung",
                    "Interne Workflow-Steuerung"
                ]
            },
            "leads": {
                "title": "Leadgewinnung & Growth Automation",
                "lead": "Automatisierte Lead-Pipelines & digitale Vertriebsprozesse",
                "desc": "Wir entwickeln intelligente Systeme zur Lead-Generierung, Qualifizierung und Übergabe – von Web Scraping bis CRM-Integration.",
                "features": [
                    "Web-Datenextraktion (z. B. Apify)",
                    "Lead-Scoring & Qualifizierung",
                    "CRM-Automatisierung",
                    "Outreach-Workflows"
                ]
            },
            "content": {
                "title": "Content & Social Media Automation",
                "lead": "Skalierte Inhalte für Marketing & digitale Präsenz",
                "desc": "Automatisierte Content-Workflows für Social Media, Websites und Kampagnen – von Planung bis Veröffentlichung.",
                "features": [
                    "Posting-Automatisierung",
                    "Content-Generierung",
                    "Plattform-Workflows",
                    "Performance-Tracking"
                ]
            }
        },
        "timeline": {
            "title": "Unser Projektprozess",
            "step1": {
                "title": "Erstgespräch",
                "desc": "Im Erstgespräch lernen wir uns kennen und besprechen, wie wir Ihr Unternehmen am besten unterstützen können."
            },
            "step2": {
                "title": "Prozessanalyse",
                "desc": "Wir analysieren Ihre bestehenden Prozesse und zeigen Ihnen Optimierungspotenziale auf."
            },
            "step3": {
                "title": "Umsetzung",
                "desc": "Basierend auf einem individuellen Konzept setzen wir die Lösung um und betreuen Sie danach als Partner."
            },
            "step4": {
                "title": "Review & Optimierung",
                "desc": "Wir prüfen die Ergebnisse, optimieren Prozesse kontinuierlich und sichern den Erfolg nachhaltig."
            }
        },
        "faq": {
            "title": "Häufige Fragen",
            "pricing": {
                "question": "Kostenstruktur",
                "answer": "Unsere Projekte werden individuell kalkuliert. Die Kosten setzen sich aus Konzeption, Implementierung und laufendem Betrieb zusammen. Abgerechnet wird in der Regel projektbasiert oder als monatliches Service-Modell – abhängig vom Umfang und der Komplexität."
            },
            "timeline": {
                "question": "Projektzeit & Ablauf",
                "answer": "Ein typisches Projekt gliedert sich in Analyse, Konzeption, Umsetzung und Testphase. Erste Ergebnisse sind oft bereits nach wenigen Wochen sichtbar. Die Gesamtdauer ist projektabhängig und richtet sich nach Integrationsgrad und Funktionsumfang."
            },
            "maintenance": {
                "question": "Wartung & Maintenance",
                "answer": "Die laufende Wartung und Optimierung der Systeme wird vollständig von uns übernommen. Dazu gehören Monitoring, Performance-Optimierung, Sicherheitsupdates und Anpassungen an veränderte Geschäftsprozesse."
            },
            "integration": {
                "question": "Integration & IT-Infrastruktur",
                "answer": "Eine solide IT-Infrastruktur ist Voraussetzung für eine stabile Integration. Der Umfang der Anbindung an bestehende Systeme (z. B. ERP, CRM oder Datenbanken) ist projektabhängig und wird transparent geplant und entsprechend verrechnet."
            }
        },
        "cta": {
            "title": "Bereit für Automatisierung?",
            "subtitle": "Sprich mit uns über dein Projekt oder buche direkt einen Termin.",
            "booking": "Oder buche direkt ein kostenloses Erstgespräch:",
            "bookButton": "Termin buchen"
        },
        "form": {
            "name": "Dein Name",
            "email": "Deine E-Mail",
            "message": "Beschreibe dein Projekt (mind. 20 Zeichen)",
            "submit": "Nachricht senden"
        },
        "booking": {
            "title": "Buche dein kostenloses Erstgespräch",
            "subtitle": "Wähle direkt einen Termin in unserem Live-Kalender."
        },
        "footer": {
            "claim": "Ihr Partner für individuelle KI-Lösungen und Automatisierungen.",
            "company": "Unternehmen",
            "services": "Leistungen",
            "benefits": "Vorteile",
            "process": "Prozess",
            "legal": "Rechtsdokumente",
            "imprint": "Impressum",
            "privacy": "Datenschutzerklärung",
            "contact": "Kontakt",
            "founders": "Gründer & Geschäftsführer",
            "meeting": "Kostenloses Erstgespräch",
            "copyright": "© 2026 AIzen Automation Agency. Alle Rechte vorbehalten."
        }
    },
    en: {
        "nav": {
            "services": "Services",
            "process": "Process",
            "contact": "Contact",
            "cta": "Initial Consultation"
        },
        "hero": {
            "title": "We build <span class=\"highlight shine delay-1\">smart systems</span><br>for companies that <span class=\"highlight shine delay-2\">scale</span>",
            "subtitle": "AI & process automation for sustainable, measurable business impact",
            "cta": "Book consultation"
        },
        "clients": {
            "title": "Our Clients and Partners"
        },
        "benefits": {
            "title": "Your Benefits Through Automation",
            "subtitle": "Measurable efficiency gains for your business",
            "time": {
                "title": "Time Savings",
                "desc": "Automating recurring processes saves valuable working time for strategic tasks"
            },
            "cost": {
                "title": "Cost Reduction",
                "desc": "Reduction of operational costs through efficient workflow optimization and error minimization"
            },
            "scale": {
                "title": "Scalability",
                "desc": "Grow without additional resources – our systems scale with your business"
            },
            "accuracy": {
                "title": "Accuracy",
                "desc": "AI-powered processes eliminate human errors and increase data quality"
            }
        },
        "services": {
            "title": "Our Services",
            "automation": {
                "title": "Intelligent Business Process Automation",
                "lead": "Tailored AI automation for operational business processes.",
                "desc": "We automate recurring workflows around documents, data, and systems – from quote generation through Excel workflows to intelligent folder and system integration. Individually developed, scalably implemented.",
                "features": [
                    "Document-based AI (RAG)",
                    "CRM & Helpdesk Integration",
                    "Multilingual Agents"
                ]
            },
            "chatbots": {
                "title": "AI Chatbots & Knowledge Systems",
                "lead": "Knowledge, support & customer communication – automated and precise",
                "desc": "From website chatbots to internal RAG knowledge systems: We build AI that understands information, answers contextually, and works directly with your data sources.",
                "features": [
                    "Website & Customer Service Chatbots",
                    "RAG Knowledge Systems for Enterprises",
                    "Internal FAQ & Document Assistants",
                    "Multilingual AI Communication"
                ]
            },
            "agents": {
                "title": "AI Agents & Assistant Systems",
                "lead": "Digital assistants for email, systems & daily workflows",
                "desc": "AI agents that don't just respond – they act: Prepare emails, control tasks, operate systems, and actively drive processes forward.",
                "features": [
                    "Outlook & Email Agents",
                    "Task & Appointment Automation",
                    "Internal Workflow Control"
                ]
            },
            "leads": {
                "title": "Lead Generation & Growth Automation",
                "lead": "Automated lead pipelines & digital sales processes",
                "desc": "We develop intelligent systems for lead generation, qualification, and handoff – from web scraping to CRM integration.",
                "features": [
                    "Web Data Extraction (e.g., Apify)",
                    "Lead Scoring & Qualification",
                    "CRM Automation",
                    "Outreach Workflows"
                ]
            },
            "content": {
                "title": "Content & Social Media Automation",
                "lead": "Scaled content for marketing & digital presence",
                "desc": "Automated content workflows for social media, websites, and campaigns – from planning to publication.",
                "features": [
                    "Posting Automation",
                    "Content Generation",
                    "Platform Workflows",
                    "Performance Tracking"
                ]
            }
        },
        "timeline": {
            "title": "Our Project Process",
            "step1": {
                "title": "Initial Consultation",
                "desc": "In the initial consultation, we get to know each other and discuss how we can best support your company."
            },
            "step2": {
                "title": "Process Analysis",
                "desc": "We analyze your existing processes and show you optimization potential."
            },
            "step3": {
                "title": "Implementation",
                "desc": "Based on an individual concept, we implement the solution and support you as a partner afterwards."
            },
            "step4": {
                "title": "Review & Optimization",
                "desc": "We review the results, continuously optimize processes, and ensure sustainable success."
            }
        },
        "faq": {
            "title": "Frequently Asked Questions",
            "pricing": {
                "question": "Pricing Structure",
                "answer": "Our projects are individually calculated. Costs consist of conception, implementation, and ongoing operations. Billing is typically project-based or as a monthly service model – depending on scope and complexity."
            },
            "timeline": {
                "question": "Project Timeline & Process",
                "answer": "A typical project consists of analysis, conception, implementation, and testing phases. Initial results are often visible within a few weeks. The overall duration depends on the project and is determined by the degree of integration and scope of functions."
            },
            "maintenance": {
                "question": "Maintenance & Support",
                "answer": "Ongoing maintenance and optimization of systems is fully handled by us. This includes monitoring, performance optimization, security updates, and adjustments to changed business processes."
            },
            "integration": {
                "question": "Integration & IT Infrastructure",
                "answer": "A solid IT infrastructure is a prerequisite for stable integration. The scope of connection to existing systems (e.g., ERP, CRM, or databases) is project-dependent and is transparently planned and billed accordingly."
            }
        },
        "cta": {
            "title": "Ready for Automation?",
            "subtitle": "Talk to us about your project or book an appointment directly.",
            "booking": "Or book a free initial consultation directly:",
            "bookButton": "Book appointment"
        },
        "form": {
            "name": "Your Name",
            "email": "Your Email",
            "message": "Describe your project (min. 20 characters)",
            "submit": "Send message"
        },
        "booking": {
            "title": "Book Your Free Initial Consultation",
            "subtitle": "Choose an appointment directly in our live calendar."
        },
        "footer": {
            "claim": "Your partner for custom AI solutions and automation.",
            "company": "Company",
            "services": "Services",
            "benefits": "Benefits",
            "process": "Process",
            "legal": "Legal Documents",
            "imprint": "Imprint",
            "privacy": "Privacy Policy",
            "contact": "Contact",
            "founders": "Founders & Managing Directors",
            "meeting": "Free Initial Consultation",
            "copyright": "© 2026 AIzen Automation Agency. All rights reserved."
        }
    },
    fr: {
        "nav": {
            "services": "Services",
            "process": "Processus",
            "contact": "Contact",
            "cta": "Consultation initiale"
        },
        "hero": {
            "title": "Nous construisons des <span class=\"highlight shine delay-1\">systèmes intelligents</span><br>pour les entreprises qui <span class=\"highlight shine delay-2\">évoluent</span>",
            "subtitle": "Automatisation IA & processus pour un impact commercial durable et mesurable",
            "cta": "Réserver une consultation"
        },
        "clients": {
            "title": "Nos Clients et Partenaires"
        },
        "benefits": {
            "title": "Vos Avantages grâce à l'Automatisation",
            "subtitle": "Gains d'efficacité mesurables pour votre entreprise",
            "time": {
                "title": "Gain de Temps",
                "desc": "L'automatisation des processus récurrents libère du temps précieux pour les tâches stratégiques"
            },
            "cost": {
                "title": "Réduction des Coûts",
                "desc": "Réduction des coûts opérationnels grâce à l'optimisation efficace des workflows et à la minimisation des erreurs"
            },
            "scale": {
                "title": "Évolutivité",
                "desc": "Croissez sans ressources supplémentaires – nos systèmes évoluent avec votre entreprise"
            },
            "accuracy": {
                "title": "Précision",
                "desc": "Les processus basés sur l'IA éliminent les erreurs humaines et augmentent la qualité des données"
            }
        },
        "services": {
            "title": "Nos Services",
            "automation": {
                "title": "Automatisation Intelligente des Processus Métier",
                "lead": "Automatisation IA sur mesure pour les processus opérationnels.",
                "desc": "Nous automatisons les flux de travail récurrents autour des documents, des données et des systèmes – de la génération de devis aux workflows Excel jusqu'à l'intégration intelligente des dossiers et des systèmes. Développé individuellement, mis en œuvre de manière évolutive.",
                "features": [
                    "IA basée sur les documents (RAG)",
                    "Intégration CRM & Helpdesk",
                    "Agents multilingues"
                ]
            },
            "chatbots": {
                "title": "Chatbots IA & Systèmes de Connaissances",
                "lead": "Connaissances, support & communication client – automatisés et précis",
                "desc": "Du chatbot de site Web au système de connaissances RAG interne : Nous construisons une IA qui comprend les informations, répond de manière contextuelle et travaille directement avec vos sources de données.",
                "features": [
                    "Chatbots site Web & service client",
                    "Systèmes de connaissances RAG pour entreprises",
                    "Assistants FAQ & documents internes",
                    "Communication IA multilingue"
                ]
            },
            "agents": {
                "title": "Agents IA & Systèmes d'Assistance",
                "lead": "Assistants numériques pour emails, systèmes & flux de travail quotidiens",
                "desc": "Des agents IA qui ne se contentent pas de répondre – ils agissent : Préparent les emails, contrôlent les tâches, gèrent les systèmes et font avancer activement les processus.",
                "features": [
                    "Agents Outlook & Email",
                    "Automatisation des tâches & rendez-vous",
                    "Contrôle des workflows internes"
                ]
            },
            "leads": {
                "title": "Génération de Leads & Automatisation de la Croissance",
                "lead": "Pipelines de leads automatisés & processus de vente numériques",
                "desc": "Nous développons des systèmes intelligents pour la génération, la qualification et le transfert de leads – du web scraping à l'intégration CRM.",
                "features": [
                    "Extraction de données Web (ex : Apify)",
                    "Scoring & qualification des leads",
                    "Automatisation CRM",
                    "Workflows de prospection"
                ]
            },
            "content": {
                "title": "Automatisation de Contenu & Réseaux Sociaux",
                "lead": "Contenu évolutif pour le marketing & la présence numérique",
                "desc": "Workflows de contenu automatisés pour les réseaux sociaux, les sites Web et les campagnes – de la planification à la publication.",
                "features": [
                    "Automatisation de publication",
                    "Génération de contenu",
                    "Workflows de plateforme",
                    "Suivi des performances"
                ]
            }
        },
        "timeline": {
            "title": "Notre Processus de Projet",
            "step1": {
                "title": "Consultation Initiale",
                "desc": "Lors de la consultation initiale, nous apprenons à nous connaître et discutons de la meilleure façon de soutenir votre entreprise."
            },
            "step2": {
                "title": "Analyse des Processus",
                "desc": "Nous analysons vos processus existants et vous montrons le potentiel d'optimisation."
            },
            "step3": {
                "title": "Mise en Œuvre",
                "desc": "Sur la base d'un concept individuel, nous mettons en œuvre la solution et vous accompagnons ensuite en tant que partenaire."
            },
            "step4": {
                "title": "Révision & Optimisation",
                "desc": "Nous vérifions les résultats, optimisons continuellement les processus et assurons un succès durable."
            }
        },
        "faq": {
            "title": "Questions Fréquentes",
            "pricing": {
                "question": "Structure Tarifaire",
                "answer": "Nos projets sont calculés individuellement. Les coûts comprennent la conception, la mise en œuvre et les opérations courantes. La facturation se fait généralement par projet ou sous forme de modèle de service mensuel – selon la portée et la complexité."
            },
            "timeline": {
                "question": "Délai & Déroulement du Projet",
                "answer": "Un projet typique se compose de phases d'analyse, de conception, de mise en œuvre et de test. Les premiers résultats sont souvent visibles en quelques semaines. La durée totale dépend du projet et est déterminée par le degré d'intégration et la portée des fonctions."
            },
            "maintenance": {
                "question": "Maintenance & Support",
                "answer": "La maintenance et l'optimisation continues des systèmes sont entièrement prises en charge par nous. Cela comprend la surveillance, l'optimisation des performances, les mises à jour de sécurité et les ajustements aux processus métier modifiés."
            },
            "integration": {
                "question": "Intégration & Infrastructure IT",
                "answer": "Une infrastructure informatique solide est une condition préalable à une intégration stable. La portée de la connexion aux systèmes existants (par exemple ERP, CRM ou bases de données) dépend du projet et est planifiée de manière transparente et facturée en conséquence."
            }
        },
        "cta": {
            "title": "Prêt pour l'Automatisation?",
            "subtitle": "Parlez-nous de votre projet ou prenez directement rendez-vous.",
            "booking": "Ou réservez directement une consultation initiale gratuite:",
            "bookButton": "Prendre rendez-vous"
        },
        "form": {
            "name": "Votre Nom",
            "email": "Votre Email",
            "message": "Décrivez votre projet (min. 20 caractères)",
            "submit": "Envoyer le message"
        },
        "booking": {
            "title": "Réservez Votre Consultation Initiale Gratuite",
            "subtitle": "Choisissez un rendez-vous directement dans notre calendrier en direct."
        },
        "footer": {
            "claim": "Votre partenaire pour des solutions IA personnalisées et l'automatisation.",
            "company": "Entreprise",
            "services": "Services",
            "benefits": "Avantages",
            "process": "Processus",
            "legal": "Documents Juridiques",
            "imprint": "Mentions Légales",
            "privacy": "Politique de Confidentialité",
            "contact": "Contact",
            "founders": "Fondateurs & Directeurs Généraux",
            "meeting": "Consultation Initiale Gratuite",
            "copyright": "© 2026 AIzen Automation Agency. Tous droits réservés."
        }
    }
};

class I18n {
    constructor() {
        this.currentLang = localStorage.getItem('aizenLang') || 'de';
        this.translations = TRANSLATIONS[this.currentLang] || TRANSLATIONS.de;
    }

    init() {
        console.log(`✅ Sprache geladen: ${this.currentLang}`);
        document.documentElement.lang = this.currentLang;
        this.updateUI();
        this.setupLanguageSwitcher();
    }

    switchLanguage(lang) {
        if (TRANSLATIONS[lang]) {
            this.currentLang = lang;
            this.translations = TRANSLATIONS[lang];
            localStorage.setItem('aizenLang', lang);
            document.documentElement.lang = lang;
            this.updateUI();
            console.log(`✅ Sprache gewechselt zu: ${lang}`);
        }
    }

    translate(key) {
        const keys = key.split('.');
        let value = this.translations;

        for (const k of keys) {
            if (value && typeof value === 'object') {
                value = value[k];
            } else {
                console.warn(`⚠️ Translation key not found: ${key}`);
                return key;
            }
        }

        return value || key;
    }

    updateUI() {
        // TEXT CONTENT
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.translate(key);

            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });

        // HTML CONTENT (für Hero Title mit spans)
        document.querySelectorAll('[data-i18n-html]').forEach(el => {
            const key = el.getAttribute('data-i18n-html');
            const translation = this.translate(key);
            el.innerHTML = translation;
        });

        // PLACEHOLDERS
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            el.placeholder = this.translate(key);
        });

        // Update Language Button
        const langCode = this.currentLang.toUpperCase();
        const currentLangEl = document.getElementById('currentLang');
        if (currentLangEl) currentLangEl.textContent = langCode;

        // Mark active language in dropdown
        document.querySelectorAll('.lang-option').forEach(option => {
            const optionLang = option.getAttribute('data-lang');
            if (optionLang === this.currentLang) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    setupLanguageSwitcher() {
        const langBtn = document.getElementById('langBtn');
        const langSwitcher = document.querySelector('.lang-switcher');
        const langDropdown = document.getElementById('langDropdown');

        if (!langBtn || !langSwitcher || !langDropdown) {
            console.error('❌ Language switcher elements not found');
            return;
        }

        // Toggle Dropdown
        langBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            langSwitcher.classList.toggle('active');
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!langSwitcher.contains(e.target)) {
                langSwitcher.classList.remove('active');
            }
        });

        // Language Options
        document.querySelectorAll('.lang-option').forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const newLang = option.getAttribute('data-lang');

                if (newLang !== this.currentLang) {
                    this.switchLanguage(newLang);
                }

                langSwitcher.classList.remove('active');
            });
        });
    }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    const i18n = new I18n();
    i18n.init();
    window.i18n = i18n;
});
