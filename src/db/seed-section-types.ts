import { db } from "@/db";
import { sectionTypes } from "@/db/schema";

const SECTION_TYPE_SEEDS = [
  {
    "slug": "navigation",
    "name": "Navigation",
    "category": "Navigation",
    "description": "Logo, menu links, CTA button",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect y=\"20\" width=\"224\" height=\"40\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"12\" y=\"30\" width=\"24\" height=\"20\" rx=\"3\" fill=\"#9ca3af\"/><g transform=\"translate(48, 36)\"><rect width=\"24\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"32\" width=\"24\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"64\" width=\"24\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"96\" width=\"24\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/></g><rect x=\"176\" y=\"32\" width=\"36\" height=\"16\" rx=\"8\" fill=\"#6b7280\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 0
  },
  {
    "slug": "sticky-header",
    "name": "Sticky Header",
    "category": "Navigation",
    "description": "Fixed nav that stays on scroll",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect y=\"10\" width=\"224\" height=\"3\" rx=\"1\" fill=\"#d1d5db\"/><rect y=\"18\" width=\"224\" height=\"36\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"12\" y=\"26\" width=\"20\" height=\"20\" rx=\"3\" fill=\"#9ca3af\"/><g transform=\"translate(44, 32)\"><rect width=\"20\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"28\" width=\"20\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"56\" width=\"20\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"84\" width=\"20\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/></g><rect x=\"176\" y=\"28\" width=\"36\" height=\"16\" rx=\"8\" fill=\"#6b7280\"/><rect y=\"54\" width=\"224\" height=\"2\" rx=\"1\" fill=\"#e5e7eb\" opacity=\"0.5\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 1
  },
  {
    "slug": "mega-menu",
    "name": "Mega Menu",
    "category": "Navigation",
    "description": "Expanded dropdown with categories",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"12\" rx=\"2\" fill=\"#e5e7eb\"/><g transform=\"translate(0, 20)\"><g transform=\"translate(0, 0)\"><rect width=\"48\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(56, 0)\"><rect width=\"48\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(112, 0)\"><rect width=\"48\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(168, 0)\"><rect width=\"48\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 2
  },
  {
    "slug": "breadcrumbs",
    "name": "Breadcrumbs",
    "category": "Navigation",
    "description": "Page path hierarchy links",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g transform=\"translate(0, 30)\"><rect width=\"30\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><text x=\"36\" y=\"8\" font-size=\"10\" fill=\"#9ca3af\">/</text><rect x=\"46\" width=\"40\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><text x=\"92\" y=\"8\" font-size=\"10\" fill=\"#9ca3af\">/</text><rect x=\"102\" width=\"50\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 3
  },
  {
    "slug": "hero",
    "name": "Hero",
    "category": "Hero",
    "description": "Headline, subtext, CTA buttons",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"40\" width=\"144\" height=\"12\" rx=\"6\" fill=\"#9ca3af\"/><rect x=\"20\" y=\"20\" width=\"184\" height=\"6\" rx=\"3\" fill=\"#e5e7eb\"/><rect x=\"40\" y=\"32\" width=\"144\" height=\"6\" rx=\"3\" fill=\"#e5e7eb\"/><g transform=\"translate(60, 52)\"><rect width=\"50\" height=\"18\" rx=\"9\" fill=\"#9ca3af\"/><rect x=\"58\" width=\"50\" height=\"18\" rx=\"9\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 4
  },
  {
    "slug": "hero-split",
    "name": "Hero Split",
    "category": "Hero",
    "description": "Text left, image right layout",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g><rect width=\"100\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><rect y=\"14\" width=\"90\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"23\" width=\"80\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"36\" width=\"50\" height=\"14\" rx=\"7\" fill=\"#9ca3af\"/></g><rect x=\"120\" y=\"0\" width=\"104\" height=\"70\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 5
  },
  {
    "slug": "hero-video",
    "name": "Hero Video",
    "category": "Hero",
    "description": "Background video with overlay text",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"70\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><g transform=\"translate(97, 20)\"><circle cx=\"15\" cy=\"15\" r=\"15\" fill=\"white\" opacity=\"0.9\"/><polygon points=\"12,8 12,22 22,15\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 6
  },
  {
    "slug": "hero-slider",
    "name": "Hero Slider",
    "category": "Hero",
    "description": "Rotating hero banners",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"56\" rx=\"4\" fill=\"#e5e7eb\"/><g transform=\"translate(90, 64)\"><circle cx=\"6\" cy=\"4\" r=\"4\" fill=\"#9ca3af\"/><circle cx=\"18\" cy=\"4\" r=\"4\" fill=\"#d1d5db\"/><circle cx=\"30\" cy=\"4\" r=\"4\" fill=\"#d1d5db\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 7
  },
  {
    "slug": "about",
    "name": "About",
    "category": "Content",
    "description": "Company story, mission, values",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"60\" width=\"104\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><rect y=\"18\" width=\"224\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"27\" width=\"200\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"36\" width=\"220\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"45\" width=\"180\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"54\" width=\"210\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 8
  },
  {
    "slug": "content-block",
    "name": "Content Block",
    "category": "Content",
    "description": "Generic text and image section",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"60\" width=\"104\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><rect y=\"18\" width=\"224\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"27\" width=\"200\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"36\" width=\"220\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"45\" width=\"180\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"54\" width=\"210\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 9
  },
  {
    "slug": "card-grid",
    "name": "Card Grid",
    "category": "Content",
    "description": "Flexible grid of content cards",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"100\" height=\"38\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"6\" y=\"6\" width=\"30\" height=\"18\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"42\" y=\"8\" width=\"50\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"42\" y=\"18\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"28\" width=\"88\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><rect width=\"100\" height=\"38\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"6\" y=\"6\" width=\"30\" height=\"18\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"42\" y=\"8\" width=\"50\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"42\" y=\"18\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"28\" width=\"88\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(0, 44)\"><rect width=\"100\" height=\"38\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"6\" y=\"6\" width=\"30\" height=\"18\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"42\" y=\"8\" width=\"50\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"42\" y=\"18\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"28\" width=\"88\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 44)\"><rect width=\"100\" height=\"38\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"6\" y=\"6\" width=\"30\" height=\"18\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"42\" y=\"8\" width=\"50\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"42\" y=\"18\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"28\" width=\"88\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 10
  },
  {
    "slug": "features",
    "name": "Features",
    "category": "Content",
    "description": "Icon cards with feature descriptions",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"60\" height=\"76\" rx=\"8\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"18\" r=\"10\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"6\" y=\"48\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"56\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"64\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(78, 0)\"><rect width=\"60\" height=\"76\" rx=\"8\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"18\" r=\"10\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"6\" y=\"48\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"56\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"64\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(156, 0)\"><rect width=\"60\" height=\"76\" rx=\"8\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"18\" r=\"10\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"6\" y=\"48\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"56\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"64\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 11
  },
  {
    "slug": "benefits",
    "name": "Benefits",
    "category": "Content",
    "description": "Value propositions with icons",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"60\" height=\"76\" rx=\"8\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"18\" r=\"10\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"6\" y=\"48\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"56\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"64\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(78, 0)\"><rect width=\"60\" height=\"76\" rx=\"8\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"18\" r=\"10\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"6\" y=\"48\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"56\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"64\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(156, 0)\"><rect width=\"60\" height=\"76\" rx=\"8\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"18\" r=\"10\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"6\" y=\"48\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"56\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"64\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 12
  },
  {
    "slug": "how-it-works",
    "name": "How It Works",
    "category": "Content",
    "description": "Numbered steps or process flow",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><circle cx=\"25\" cy=\"16\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"25\" y=\"20\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"600\" fill=\"#9ca3af\">1</text><rect x=\"5\" y=\"38\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"2\" y=\"47\" width=\"46\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"54\" width=\"38\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(75, 0)\"><circle cx=\"25\" cy=\"16\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"25\" y=\"20\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"600\" fill=\"#9ca3af\">2</text><rect x=\"5\" y=\"38\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"2\" y=\"47\" width=\"46\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"54\" width=\"38\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(150, 0)\"><circle cx=\"25\" cy=\"16\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"25\" y=\"20\" text-anchor=\"middle\" font-size=\"12\" font-weight=\"600\" fill=\"#9ca3af\">3</text><rect x=\"5\" y=\"38\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"2\" y=\"47\" width=\"46\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"54\" width=\"38\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><line x1=\"45\" y1=\"16\" x2=\"70\" y2=\"16\" stroke=\"#d1d5db\" stroke-width=\"2\" stroke-dasharray=\"4,4\"/><line x1=\"120\" y1=\"16\" x2=\"145\" y2=\"16\" stroke=\"#d1d5db\" stroke-width=\"2\" stroke-dasharray=\"4,4\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 13
  },
  {
    "slug": "services",
    "name": "Services",
    "category": "Content",
    "description": "Service offerings with descriptions",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"100\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"20\" height=\"20\" rx=\"4\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"34\" width=\"60\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"44\" width=\"84\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"52\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><rect width=\"100\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"20\" height=\"20\" rx=\"4\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"34\" width=\"60\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"44\" width=\"84\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"52\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 14
  },
  {
    "slug": "columns",
    "name": "Columns",
    "category": "Content",
    "description": "Multi-column text layout",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"60\" height=\"68\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"20\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"28\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"44\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"52\" width=\"42\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(78, 0)\"><rect width=\"60\" height=\"68\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"20\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"28\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"44\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"52\" width=\"42\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(156, 0)\"><rect width=\"60\" height=\"68\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"44\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"20\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"28\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"36\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"44\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"52\" width=\"42\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 15
  },
  {
    "slug": "text-block",
    "name": "Text Block",
    "category": "Content",
    "description": "Rich text content area",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"60\" width=\"104\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><rect y=\"18\" width=\"224\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"27\" width=\"200\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"36\" width=\"220\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"45\" width=\"180\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"54\" width=\"210\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 16
  },
  {
    "slug": "stats",
    "name": "Stats/Numbers",
    "category": "Content",
    "description": "Key metrics and counters",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 10)\"><text x=\"20\" y=\"16\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#6b7280\">99+</text><rect x=\"2\" y=\"28\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(58, 10)\"><text x=\"20\" y=\"16\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#6b7280\">10k</text><rect x=\"2\" y=\"28\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(116, 10)\"><text x=\"20\" y=\"16\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#6b7280\">24/7</text><rect x=\"2\" y=\"28\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(174, 10)\"><text x=\"20\" y=\"16\" text-anchor=\"middle\" font-size=\"18\" font-weight=\"700\" fill=\"#6b7280\">5★</text><rect x=\"2\" y=\"28\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 17
  },
  {
    "slug": "timeline",
    "name": "Timeline",
    "category": "Content",
    "description": "Chronological events or milestones",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><line x1=\"112\" y1=\"0\" x2=\"112\" y2=\"68\" stroke=\"#d1d5db\" stroke-width=\"2\"/><g transform=\"translate(0, 0)\"><circle cx=\"112\" cy=\"8\" r=\"6\" fill=\"#9ca3af\"/><rect x=\"0\" y=\"2\" width=\"80\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"0\" y=\"10\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"0\" y=\"18\" width=\"60\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(0, 34)\"><circle cx=\"112\" cy=\"8\" r=\"6\" fill=\"#9ca3af\"/><rect x=\"124\" y=\"2\" width=\"80\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"124\" y=\"10\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"124\" y=\"18\" width=\"60\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 18
  },
  {
    "slug": "comparison",
    "name": "Comparison Table",
    "category": "Content",
    "description": "Feature comparison grid",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"68\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"0\" y=\"0\" width=\"224\" height=\"16\" rx=\"4\" fill=\"#e5e7eb\"/><rect x=\"80\" y=\"4\" width=\"40\" height=\"8\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"140\" y=\"4\" width=\"40\" height=\"8\" rx=\"2\" fill=\"#d1d5db\"/><g><line x1=\"0\" y1=\"20\" x2=\"224\" y2=\"20\" stroke=\"#e5e7eb\"/><rect x=\"8\" y=\"22\" width=\"50\" height=\"6\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"100\" cy=\"25\" r=\"5\" fill=\"#d1d5db\"/><circle cx=\"160\" cy=\"25\" r=\"5\" fill=\"#9ca3af\"/></g><g><line x1=\"0\" y1=\"36\" x2=\"224\" y2=\"36\" stroke=\"#e5e7eb\"/><rect x=\"8\" y=\"38\" width=\"50\" height=\"6\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"100\" cy=\"41\" r=\"5\" fill=\"#d1d5db\"/><circle cx=\"160\" cy=\"41\" r=\"5\" fill=\"#9ca3af\"/></g><g><line x1=\"0\" y1=\"52\" x2=\"224\" y2=\"52\" stroke=\"#e5e7eb\"/><rect x=\"8\" y=\"54\" width=\"50\" height=\"6\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"100\" cy=\"57\" r=\"5\" fill=\"#d1d5db\"/><circle cx=\"160\" cy=\"57\" r=\"5\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 19
  },
  {
    "slug": "image-gallery",
    "name": "Image Gallery",
    "category": "Media",
    "description": "Grid of images with lightbox",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"0\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"58\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"116\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"174\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"0\" y=\"36\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"58\" y=\"36\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"116\" y=\"36\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"174\" y=\"36\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 20
  },
  {
    "slug": "video-section",
    "name": "Video Section",
    "category": "Media",
    "description": "Embedded video with text",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"70\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><g transform=\"translate(97, 20)\"><circle cx=\"15\" cy=\"15\" r=\"15\" fill=\"white\" opacity=\"0.9\"/><polygon points=\"12,8 12,22 22,15\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 21
  },
  {
    "slug": "bento-grid",
    "name": "Bento Grid",
    "category": "Media",
    "description": "Mixed-size content tiles",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"108\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"116\" width=\"108\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"116\" y=\"38\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"174\" y=\"38\" width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 22
  },
  {
    "slug": "masonry",
    "name": "Masonry Grid",
    "category": "Media",
    "description": "Pinterest-style image layout",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"70\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"78\" width=\"70\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"78\" y=\"48\" width=\"70\" height=\"20\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"156\" width=\"68\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"156\" y=\"38\" width=\"68\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 23
  },
  {
    "slug": "carousel",
    "name": "Carousel",
    "category": "Media",
    "description": "Sliding content or images",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><polygon points=\"0,30 10,22 10,38\" fill=\"#d1d5db\"/><rect x=\"20\" width=\"60\" height=\"60\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"88\" width=\"60\" height=\"60\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"156\" width=\"60\" height=\"60\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><polygon points=\"224,30 214,22 214,38\" fill=\"#d1d5db\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 24
  },
  {
    "slug": "testimonials",
    "name": "Testimonials",
    "category": "Social Proof",
    "description": "Customer quotes with photos",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"100\" height=\"80\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><text x=\"8\" y=\"18\" font-size=\"24\" fill=\"#d1d5db\">\"</text><rect x=\"8\" y=\"26\" width=\"84\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"34\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"42\" width=\"78\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"20\" cy=\"62\" r=\"10\" fill=\"#e5e7eb\"/><rect x=\"36\" y=\"56\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"36\" y=\"64\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><rect width=\"100\" height=\"80\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><text x=\"8\" y=\"18\" font-size=\"24\" fill=\"#d1d5db\">\"</text><rect x=\"8\" y=\"26\" width=\"84\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"34\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"42\" width=\"78\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"20\" cy=\"62\" r=\"10\" fill=\"#e5e7eb\"/><rect x=\"36\" y=\"56\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"36\" y=\"64\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 25
  },
  {
    "slug": "reviews",
    "name": "Reviews",
    "category": "Social Proof",
    "description": "Star ratings and review text",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"100\" height=\"80\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><text x=\"8\" y=\"18\" font-size=\"24\" fill=\"#d1d5db\">\"</text><rect x=\"8\" y=\"26\" width=\"84\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"34\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"42\" width=\"78\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"20\" cy=\"62\" r=\"10\" fill=\"#e5e7eb\"/><rect x=\"36\" y=\"56\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"36\" y=\"64\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><rect width=\"100\" height=\"80\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><text x=\"8\" y=\"18\" font-size=\"24\" fill=\"#d1d5db\">\"</text><rect x=\"8\" y=\"26\" width=\"84\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"34\" width=\"70\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"42\" width=\"78\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><circle cx=\"20\" cy=\"62\" r=\"10\" fill=\"#e5e7eb\"/><rect x=\"36\" y=\"56\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"36\" y=\"64\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 26
  },
  {
    "slug": "logo-cloud",
    "name": "Logo Cloud",
    "category": "Social Proof",
    "description": "Partner or client logos",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"60\" width=\"104\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><g transform=\"translate(0, 20)\"><rect x=\"0\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"48\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"96\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"144\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"192\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g><g transform=\"translate(24, 50)\"><rect x=\"0\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"48\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"96\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"144\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 27
  },
  {
    "slug": "case-studies",
    "name": "Case Studies",
    "category": "Social Proof",
    "description": "Success story previews",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"100\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"84\" height=\"30\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"44\" width=\"60\" height=\"6\" rx=\"3\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"54\" width=\"80\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><rect width=\"100\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"8\" y=\"8\" width=\"84\" height=\"30\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"44\" width=\"60\" height=\"6\" rx=\"3\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"54\" width=\"80\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 28
  },
  {
    "slug": "clients",
    "name": "Clients",
    "category": "Social Proof",
    "description": "Client logos with names",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"60\" width=\"104\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><g transform=\"translate(0, 20)\"><rect x=\"0\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"48\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"96\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"144\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"192\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g><g transform=\"translate(24, 50)\"><rect x=\"0\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"48\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"96\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"144\" width=\"32\" height=\"22\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 29
  },
  {
    "slug": "awards",
    "name": "Awards/Badges",
    "category": "Social Proof",
    "description": "Certifications and recognitions",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"42\" height=\"50\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"21\" cy=\"18\" r=\"12\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"36\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(58, 0)\"><rect width=\"42\" height=\"50\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"21\" cy=\"18\" r=\"12\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"36\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(116, 0)\"><rect width=\"42\" height=\"50\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"21\" cy=\"18\" r=\"12\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"36\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(174, 0)\"><rect width=\"42\" height=\"50\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"21\" cy=\"18\" r=\"12\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"36\" width=\"30\" height=\"4\" rx=\"2\" fill=\"#d1d5db\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 30
  },
  {
    "slug": "cta",
    "name": "Call to Action",
    "category": "CTA",
    "description": "Headline, text, action button",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"80\" rx=\"8\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"42\" y=\"14\" width=\"140\" height=\"10\" rx=\"5\" fill=\"#9ca3af\"/><rect x=\"32\" y=\"32\" width=\"160\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"52\" y=\"42\" width=\"120\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"72\" y=\"56\" width=\"80\" height=\"18\" rx=\"9\" fill=\"#6b7280\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 31
  },
  {
    "slug": "cta-banner",
    "name": "CTA Banner",
    "category": "CTA",
    "description": "Full-width promotional banner",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"80\" rx=\"8\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"42\" y=\"14\" width=\"140\" height=\"10\" rx=\"5\" fill=\"#9ca3af\"/><rect x=\"32\" y=\"32\" width=\"160\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"52\" y=\"42\" width=\"120\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"72\" y=\"56\" width=\"80\" height=\"18\" rx=\"9\" fill=\"#6b7280\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 32
  },
  {
    "slug": "banner",
    "name": "Banner",
    "category": "CTA",
    "description": "Promotional message with CTA",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"80\" rx=\"8\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"42\" y=\"14\" width=\"140\" height=\"10\" rx=\"5\" fill=\"#9ca3af\"/><rect x=\"32\" y=\"32\" width=\"160\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"52\" y=\"42\" width=\"120\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"72\" y=\"56\" width=\"80\" height=\"18\" rx=\"9\" fill=\"#6b7280\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 33
  },
  {
    "slug": "newsletter",
    "name": "Newsletter",
    "category": "CTA",
    "description": "Email signup with input field",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"40\" width=\"144\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"50\" y=\"14\" width=\"124\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><g transform=\"translate(32, 30)\"><rect width=\"120\" height=\"24\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"128\" width=\"40\" height=\"24\" rx=\"4\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 34
  },
  {
    "slug": "download",
    "name": "Download Section",
    "category": "CTA",
    "description": "App or resource download links",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"72\" width=\"80\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"52\" y=\"14\" width=\"120\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><g transform=\"translate(52, 30)\"><rect width=\"50\" height=\"28\" rx=\"6\" fill=\"#9ca3af\" stroke=\"none\"/><rect x=\"60\" width=\"50\" height=\"28\" rx=\"6\" fill=\"#9ca3af\" stroke=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 35
  },
  {
    "slug": "contact-form",
    "name": "Contact Form",
    "category": "Forms",
    "description": "Name, email, message fields",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"100\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"12\" width=\"100\" height=\"20\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"108\" width=\"116\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"108\" y=\"12\" width=\"116\" height=\"20\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect y=\"40\" width=\"224\" height=\"20\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"164\" y=\"66\" width=\"60\" height=\"16\" rx=\"8\" fill=\"#9ca3af\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 36
  },
  {
    "slug": "login-form",
    "name": "Login Form",
    "category": "Forms",
    "description": "Email and password inputs",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"52\" width=\"120\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"12\" y=\"16\" width=\"200\" height=\"18\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"12\" y=\"40\" width=\"200\" height=\"18\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"72\" y=\"64\" width=\"80\" height=\"18\" rx=\"9\" fill=\"#9ca3af\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 37
  },
  {
    "slug": "signup-form",
    "name": "Sign Up Form",
    "category": "Forms",
    "description": "Registration form fields",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"52\" width=\"120\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"12\" y=\"16\" width=\"200\" height=\"18\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"12\" y=\"40\" width=\"200\" height=\"18\" rx=\"4\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"72\" y=\"64\" width=\"80\" height=\"18\" rx=\"9\" fill=\"#9ca3af\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 38
  },
  {
    "slug": "search",
    "name": "Search Section",
    "category": "Forms",
    "description": "Search bar with filters",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"32\" y=\"20\" width=\"160\" height=\"28\" rx=\"14\" fill=\"#f3f4f6\" stroke=\"none\"/><circle cx=\"54\" cy=\"34\" r=\"8\" stroke=\"#d1d5db\" stroke-width=\"2\" fill=\"none\"/><line x1=\"60\" y1=\"40\" x2=\"64\" y2=\"44\" stroke=\"#d1d5db\" stroke-width=\"2\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 39
  },
  {
    "slug": "pricing",
    "name": "Pricing",
    "category": "Commerce",
    "description": "Plan cards with prices and features",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"60\" height=\"80\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"10\" y=\"8\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><text x=\"30\" y=\"30\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"#6b7280\">$<!-- -->9</text><rect x=\"6\" y=\"40\" width=\"48\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"48\" width=\"44\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"56\" width=\"40\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"66\" width=\"40\" height=\"10\" rx=\"5\" fill=\"#9ca3af\"/></g><g transform=\"translate(78, 0)\"><rect width=\"60\" height=\"80\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"10\" y=\"8\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><text x=\"30\" y=\"30\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"#6b7280\">$<!-- -->29</text><rect x=\"6\" y=\"40\" width=\"48\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"48\" width=\"44\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"56\" width=\"40\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"66\" width=\"40\" height=\"10\" rx=\"5\" fill=\"#9ca3af\"/></g><g transform=\"translate(156, 0)\"><rect width=\"60\" height=\"80\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"10\" y=\"8\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><text x=\"30\" y=\"30\" text-anchor=\"middle\" font-size=\"14\" font-weight=\"700\" fill=\"#6b7280\">$<!-- -->99</text><rect x=\"6\" y=\"40\" width=\"48\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"48\" width=\"44\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"6\" y=\"56\" width=\"40\" height=\"3\" rx=\"1\" fill=\"#e5e7eb\"/><rect x=\"10\" y=\"66\" width=\"40\" height=\"10\" rx=\"5\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 40
  },
  {
    "slug": "product-grid",
    "name": "Product Grid",
    "category": "Commerce",
    "description": "Product cards with images",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"50\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"46\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"54\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#9ca3af\"/></g><g transform=\"translate(58, 0)\"><rect width=\"50\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"46\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"54\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#9ca3af\"/></g><g transform=\"translate(116, 0)\"><rect width=\"50\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"46\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"54\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#9ca3af\"/></g><g transform=\"translate(174, 0)\"><rect width=\"50\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"46\" width=\"36\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"54\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 41
  },
  {
    "slug": "product-featured",
    "name": "Featured Product",
    "category": "Commerce",
    "description": "Single product showcase",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"100\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><g transform=\"translate(116, 0)\"><rect width=\"80\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect y=\"14\" width=\"100\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"23\" width=\"90\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><text x=\"0\" y=\"44\" font-size=\"14\" font-weight=\"700\" fill=\"#6b7280\">$99</text><rect y=\"52\" width=\"60\" height=\"16\" rx=\"8\" fill=\"#9ca3af\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 42
  },
  {
    "slug": "cart",
    "name": "Shopping Cart",
    "category": "Commerce",
    "description": "Cart items with totals",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"20\" height=\"20\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"28\" width=\"100\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"28\" y=\"10\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#9ca3af\"/><rect x=\"180\" y=\"6\" width=\"44\" height=\"6\" rx=\"2\" fill=\"#d1d5db\"/></g><g transform=\"translate(0, 26)\"><rect width=\"20\" height=\"20\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"28\" width=\"100\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"28\" y=\"10\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#9ca3af\"/><rect x=\"180\" y=\"6\" width=\"44\" height=\"6\" rx=\"2\" fill=\"#d1d5db\"/></g><line x1=\"0\" y1=\"54\" x2=\"224\" y2=\"54\" stroke=\"#e5e7eb\" stroke-width=\"1\"/><rect x=\"150\" y=\"60\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"194\" y=\"58\" width=\"30\" height=\"8\" rx=\"2\" fill=\"#9ca3af\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 43
  },
  {
    "slug": "blog-grid",
    "name": "Blog Grid",
    "category": "Blog",
    "description": "Article cards in grid layout",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"60\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"36\" width=\"52\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"46\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"4\" y=\"54\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(78, 0)\"><rect width=\"60\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"36\" width=\"52\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"46\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"4\" y=\"54\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(156, 0)\"><rect width=\"60\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"36\" width=\"52\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"46\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"4\" y=\"54\" width=\"48\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 44
  },
  {
    "slug": "blog-featured",
    "name": "Featured Post",
    "category": "Blog",
    "description": "Highlighted article with image",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"36\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"4\" y=\"44\" width=\"180\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect x=\"4\" y=\"56\" width=\"200\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"4\" y=\"64\" width=\"160\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 45
  },
  {
    "slug": "blog-list",
    "name": "Blog List",
    "category": "Blog",
    "description": "Article list with thumbnails",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"60\" y=\"4\" width=\"140\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"60\" y=\"14\" width=\"160\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"60\" y=\"22\" width=\"130\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(0, 36)\"><rect width=\"50\" height=\"30\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"60\" y=\"4\" width=\"140\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect x=\"60\" y=\"14\" width=\"160\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"60\" y=\"22\" width=\"130\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 46
  },
  {
    "slug": "categories",
    "name": "Categories",
    "category": "Blog",
    "description": "Category tags or cards",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"0\" y=\"20\" width=\"36\" height=\"24\" rx=\"12\" fill=\"#9ca3af\" stroke=\"none\"/><rect x=\"40\" y=\"20\" width=\"36\" height=\"24\" rx=\"12\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"80\" y=\"20\" width=\"36\" height=\"24\" rx=\"12\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"120\" y=\"20\" width=\"36\" height=\"24\" rx=\"12\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"160\" y=\"20\" width=\"36\" height=\"24\" rx=\"12\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 47
  },
  {
    "slug": "faq",
    "name": "FAQ",
    "category": "Support",
    "description": "Expandable question/answer list",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"72\" width=\"80\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><g transform=\"translate(0, 18)\"><rect width=\"224\" height=\"14\" rx=\"2\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"4\" width=\"140\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><path d=\"M210 4 L214 8 L218 4\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/></g><g transform=\"translate(0, 36)\"><rect width=\"224\" height=\"14\" rx=\"2\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"4\" width=\"150\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><path d=\"M210 4 L214 8 L218 4\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/></g><g transform=\"translate(0, 54)\"><rect width=\"224\" height=\"14\" rx=\"2\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"4\" width=\"160\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><path d=\"M210 4 L214 8 L218 4\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 48
  },
  {
    "slug": "accordion",
    "name": "Accordion",
    "category": "Support",
    "description": "Collapsible content panels",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"72\" width=\"80\" height=\"8\" rx=\"4\" fill=\"#9ca3af\"/><g transform=\"translate(0, 18)\"><rect width=\"224\" height=\"14\" rx=\"2\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"4\" width=\"140\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><path d=\"M210 4 L214 8 L218 4\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/></g><g transform=\"translate(0, 36)\"><rect width=\"224\" height=\"14\" rx=\"2\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"4\" width=\"150\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><path d=\"M210 4 L214 8 L218 4\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/></g><g transform=\"translate(0, 54)\"><rect width=\"224\" height=\"14\" rx=\"2\" fill=\"#f3f4f6\" stroke=\"none\"/><rect x=\"8\" y=\"4\" width=\"160\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><path d=\"M210 4 L214 8 L218 4\" stroke=\"#9ca3af\" stroke-width=\"1.5\" fill=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 49
  },
  {
    "slug": "tabs",
    "name": "Tabs Section",
    "category": "Support",
    "description": "Tabbed content switcher",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g><g><rect x=\"0\" width=\"44\" height=\"16\" rx=\"2\" fill=\"#9ca3af\"/></g><g><rect x=\"50\" width=\"44\" height=\"16\" rx=\"2\" fill=\"#e5e7eb\"/></g><g><rect x=\"100\" width=\"44\" height=\"16\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><rect y=\"22\" width=\"224\" height=\"46\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><rect x=\"12\" y=\"32\" width=\"160\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"12\" y=\"42\" width=\"180\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"12\" y=\"52\" width=\"140\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 50
  },
  {
    "slug": "team",
    "name": "Team",
    "category": "People",
    "description": "Member photos, names, roles",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><circle cx=\"25\" cy=\"20\" r=\"18\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"5\" y=\"44\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"54\" width=\"34\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(58, 0)\"><circle cx=\"25\" cy=\"20\" r=\"18\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"5\" y=\"44\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"54\" width=\"34\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><circle cx=\"25\" cy=\"20\" r=\"18\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"5\" y=\"44\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"54\" width=\"34\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(174, 0)\"><circle cx=\"25\" cy=\"20\" r=\"18\" fill=\"#e5e7eb\" stroke=\"none\"/><rect x=\"5\" y=\"44\" width=\"40\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"54\" width=\"34\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 51
  },
  {
    "slug": "author",
    "name": "Author Bio",
    "category": "People",
    "description": "Author photo and bio text",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><circle cx=\"40\" cy=\"34\" r=\"28\" fill=\"#e5e7eb\" stroke=\"none\"/><g transform=\"translate(84, 10)\"><rect width=\"100\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/><rect y=\"14\" width=\"80\" height=\"5\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"130\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"34\" width=\"120\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"42\" width=\"100\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 52
  },
  {
    "slug": "footer",
    "name": "Footer",
    "category": "Footer",
    "description": "Links, social icons, copyright",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"40\" height=\"16\" rx=\"2\" fill=\"#d1d5db\"/><g transform=\"translate(60, 0)\"><rect width=\"30\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"26\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"28\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(100, 0)\"><rect width=\"30\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"26\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"28\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(140, 0)\"><rect width=\"30\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"26\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"28\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(180, 0)\"><rect width=\"30\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect y=\"10\" width=\"26\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"18\" width=\"28\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"26\" width=\"24\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><line x1=\"0\" y1=\"50\" x2=\"224\" y2=\"50\" stroke=\"#e5e7eb\"/><rect y=\"58\" width=\"100\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 53
  },
  {
    "slug": "footer-simple",
    "name": "Simple Footer",
    "category": "Footer",
    "description": "Minimal copyright and links",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(60, 20)\"><rect x=\"0\" width=\"24\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"30\" width=\"24\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"60\" width=\"24\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"90\" width=\"24\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/></g><rect x=\"62\" y=\"40\" width=\"100\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 54
  },
  {
    "slug": "sitemap",
    "name": "Sitemap",
    "category": "Footer",
    "description": "Organized page link columns",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"40\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"12\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"22\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"32\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"42\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"52\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(58, 0)\"><rect width=\"40\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"12\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"22\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"32\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"42\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"52\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(116, 0)\"><rect width=\"40\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"12\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"22\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"32\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"42\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"52\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(174, 0)\"><rect width=\"40\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><rect y=\"12\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"22\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"32\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"42\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect y=\"52\" width=\"36\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 55
  },
  {
    "slug": "social-links",
    "name": "Social Links",
    "category": "Footer",
    "description": "Social media icon buttons",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g transform=\"translate(62, 20)\"><circle cx=\"10\" cy=\"14\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/><circle cx=\"40\" cy=\"14\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/><circle cx=\"70\" cy=\"14\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/><circle cx=\"100\" cy=\"14\" r=\"14\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 56
  },
  {
    "slug": "map",
    "name": "Map Section",
    "category": "Location",
    "description": "Embedded map with address",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"68\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><circle cx=\"112\" cy=\"30\" r=\"8\" fill=\"#9ca3af\"/><path d=\"M112 22 L112 38 M104 30 L120 30\" stroke=\"white\" stroke-width=\"2\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 57
  },
  {
    "slug": "locations",
    "name": "Locations Grid",
    "category": "Location",
    "description": "Multiple location cards",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><g transform=\"translate(0, 0)\"><rect width=\"60\" height=\"68\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"8\" r=\"6\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"20\" width=\"44\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"30\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"38\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"46\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(78, 0)\"><rect width=\"60\" height=\"68\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"8\" r=\"6\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"20\" width=\"44\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"30\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"38\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"46\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g><g transform=\"translate(156, 0)\"><rect width=\"60\" height=\"68\" rx=\"4\" fill=\"#f9fafb\" stroke=\"none\"/><circle cx=\"30\" cy=\"8\" r=\"6\" fill=\"#9ca3af\"/><rect x=\"8\" y=\"20\" width=\"44\" height=\"5\" rx=\"2\" fill=\"#d1d5db\"/><rect x=\"8\" y=\"30\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"38\" width=\"40\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"8\" y=\"46\" width=\"44\" height=\"4\" rx=\"2\" fill=\"#e5e7eb\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 58
  },
  {
    "slug": "divider",
    "name": "Divider",
    "category": "Utility",
    "description": "Visual separator line",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><line x1=\"0\" y1=\"34\" x2=\"224\" y2=\"34\" stroke=\"#d1d5db\" stroke-width=\"3\" stroke-dasharray=\"none\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 59
  },
  {
    "slug": "spacer",
    "name": "Spacer",
    "category": "Utility",
    "description": "Empty vertical space",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"68\" fill=\"none\" stroke=\"#e5e7eb\" stroke-width=\"1\" stroke-dasharray=\"4,4\"/><text x=\"112\" y=\"38\" text-anchor=\"middle\" font-size=\"10\" fill=\"#9ca3af\">Spacer</text></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 60
  },
  {
    "slug": "marquee",
    "name": "Marquee",
    "category": "Utility",
    "description": "Scrolling text or logos",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g transform=\"translate(0, 24)\"><g transform=\"translate(0, 0)\"><rect width=\"50\" height=\"20\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g><g transform=\"translate(60, 0)\"><rect width=\"50\" height=\"20\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g><g transform=\"translate(120, 0)\"><rect width=\"50\" height=\"20\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g><g transform=\"translate(180, 0)\"><rect width=\"50\" height=\"20\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 61
  },
  {
    "slug": "countdown",
    "name": "Countdown",
    "category": "Utility",
    "description": "Timer for events or launches",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect x=\"72\" width=\"80\" height=\"6\" rx=\"3\" fill=\"#d1d5db\"/><g transform=\"translate(22, 18)\"><g transform=\"translate(0, 0)\"><rect width=\"40\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"20\" y=\"26\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#6b7280\">00</text><text x=\"20\" y=\"52\" text-anchor=\"middle\" font-size=\"6\" fill=\"#9ca3af\">DAYS</text></g><g transform=\"translate(50, 0)\"><rect width=\"40\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"20\" y=\"26\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#6b7280\">12</text><text x=\"20\" y=\"52\" text-anchor=\"middle\" font-size=\"6\" fill=\"#9ca3af\">HRS</text></g><g transform=\"translate(100, 0)\"><rect width=\"40\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"20\" y=\"26\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#6b7280\">30</text><text x=\"20\" y=\"52\" text-anchor=\"middle\" font-size=\"6\" fill=\"#9ca3af\">MIN</text></g><g transform=\"translate(150, 0)\"><rect width=\"40\" height=\"40\" rx=\"4\" fill=\"#e5e7eb\" stroke=\"none\"/><text x=\"20\" y=\"26\" text-anchor=\"middle\" font-size=\"16\" font-weight=\"700\" fill=\"#6b7280\">45</text><text x=\"20\" y=\"52\" text-anchor=\"middle\" font-size=\"6\" fill=\"#9ca3af\">SEC</text></g></g></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 62
  },
  {
    "slug": "announcement",
    "name": "Announcement Bar",
    "category": "Utility",
    "description": "Top banner with message",
    "svgContent": "<svg width=\"280\" height=\"140\" viewBox=\"0 0 280 140\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\" class=\"rounded-lg overflow-hidden\"><rect width=\"280\" height=\"140\" fill=\"#f0f0f0\"/><rect x=\"16\" y=\"16\" width=\"248\" height=\"108\" rx=\"8\" fill=\"#ffffff\" stroke=\"none\" stroke-width=\"0\" filter=\"url(#shadow)\"/><g transform=\"translate(28, 32)\"><g><rect width=\"224\" height=\"28\" rx=\"2\" fill=\"#e5e7eb\"/><rect x=\"32\" y=\"10\" width=\"160\" height=\"8\" rx=\"4\" fill=\"#d1d5db\"/></g></g><defs><filter id=\"shadow\" x=\"-10%\" y=\"-10%\" width=\"120%\" height=\"120%\"><feDropShadow dx=\"0\" dy=\"2\" stdDeviation=\"4\" flood-opacity=\"0.1\"/></filter></defs></svg>",
    "sortOrder": 63
  }
];

export async function seedSectionTypes() {
  console.log("Seeding section types...");

  // Clear existing
  await db.delete(sectionTypes);

  // Insert all
  for (const entry of SECTION_TYPE_SEEDS) {
    await db.insert(sectionTypes).values(entry);
  }

  console.log(`Seeded ${SECTION_TYPE_SEEDS.length} section types`);
}

// Run directly if called as script
seedSectionTypes()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  });
