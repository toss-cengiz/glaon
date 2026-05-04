// Heuristic category mapping for `@untitledui/icons` exports.
//
// The kit ships 1,179 icons as flat named exports (no semantic
// metadata). The Figma "General UI icons" frame organises them into
// ~19 sections; this file mirrors that organisation by matching the
// export name against a prioritised list of regex patterns.
//
// Ordering matters: the first matching category wins, so put the most
// specific predicates first (e.g. `Arrow*` before the catch-all
// `General` bucket). Anything unmatched falls into `Other` so the
// catalog never silently drops an icon.

interface IconCategory {
  /** Stable slug used for anchor links + sort order. */
  id: string;
  /** Human-readable label rendered in the catalog section header. */
  label: string;
  /** Returns `true` if `iconName` belongs to this category. */
  matches: (iconName: string) => boolean;
}

const startsWith =
  (...prefixes: readonly string[]) =>
  (name: string): boolean =>
    prefixes.some((p) => name.startsWith(p));

const matchesAny =
  (...patterns: readonly RegExp[]) =>
  (name: string): boolean =>
    patterns.some((p) => p.test(name));

// Order: specific → broad. The first category whose `matches` returns
// `true` claims the icon. A trailing `Other` bucket catches the rest.
const ICON_CATEGORIES: readonly IconCategory[] = [
  {
    id: 'arrows',
    label: 'Arrows',
    matches: startsWith('Arrow', 'Chevron', 'Corner', 'FlipBackward', 'FlipForward', 'Switch'),
  },
  {
    id: 'media-controls',
    label: 'Media controls',
    matches: matchesAny(
      /^(Play|Pause|Stop|FastForward|Rewind|SkipBack|SkipForward|Repeat|Shuffle|Music|Album|Disc|Radio)/,
    ),
  },
  {
    id: 'editor',
    label: 'Editor',
    matches: matchesAny(
      /^(Bold|Italic|Underline|Strikethrough|Heading|Type|Pen|Pencil|Eraser|Brush|Quote|Code|TextInput|TextAlign|Indent|Outdent|Subscript|Superscript|Highlighter|MagicWand|Paragraph|Spacing)/,
    ),
  },
  {
    id: 'charts',
    label: 'Charts',
    matches: matchesAny(
      /^(Chart|BarChart|LineChart|PieChart|TrendUp|TrendDown|HorizontalBarChart|VerticalBars)/,
    ),
  },
  {
    id: 'time',
    label: 'Time',
    matches: matchesAny(/^(Clock|Calendar|Hourglass|AlarmClock|Watch|Timer)/),
  },
  {
    id: 'weather',
    label: 'Weather',
    matches: matchesAny(
      /^(Sun(?!set|rise)|Sunset|Sunrise|Moon|Cloud(?!Code|Off)|Rain|Snow|Wind|Lightning|Tornado|Umbrella|Thermometer|Stars|Hurricane|Droplet|Waves)/,
    ),
  },
  {
    id: 'security',
    label: 'Security',
    matches: matchesAny(/^(Lock|Unlock|Shield|Key(?!board)|Fingerprint|FaceId|Passcode|EyeOff)/),
  },
  {
    id: 'finance',
    label: 'Finance & eCommerce',
    matches: matchesAny(
      /^(Currency|Coins|Coin|Bitcoin|CreditCard|Wallet|Bank|Receipt|Tag(?!Off)|ShoppingCart|ShoppingBag|Cart|Gift|Sale|Pricing|Diamond|Percent|Calculator|Scales|Piggy|Trophy|Award|Medal)/,
    ),
  },
  {
    id: 'maps-travel',
    label: 'Maps & travel',
    matches: matchesAny(
      /^(Map|Marker|Pin|Compass|Globe|Navigation|Plane|Train|Car|Bus|Road|Route|Walk|Run|Flag|Anchor|Sailboat|Truck|Bike|Tram|Rocket|LuggageBag|Passport|Trees|Tree)/,
    ),
  },
  {
    id: 'communication',
    label: 'Communication',
    matches: matchesAny(
      /^(Mail|Message|Chat|Phone(?!book)|Inbox|Send|Reply|Forward|AtSign|Megaphone|Notification(?!Box)|Announcement|VoicemailEvelope)/,
    ),
  },
  {
    id: 'media-devices',
    label: 'Media & devices',
    matches: matchesAny(
      /^(Volume|Speaker|Headphones|Microphone|Mic|Camera|Monitor|Tablet|Tv|Laptop|Mouse|Keyboard|Airpods|Airplay|Cast|Bluetooth|Battery|Wifi|Signal|Server|HardDrive|Disc|PowerButton|UsbFlashDrive|GamingPad|Joystick)/,
    ),
  },
  {
    id: 'images',
    label: 'Images',
    matches: matchesAny(/^(Image|Aperture|Crop|Flash|Gallery|FilmStrip|Camera|Frame)/),
  },
  {
    id: 'files',
    label: 'Files',
    matches: matchesAny(/^(File|Folder|Archive|Briefcase|Drawer|Paperclip)/),
  },
  {
    id: 'users',
    label: 'Users',
    matches: matchesAny(
      /^(User(?!sCheck)|Users|Person|Profile|Face(?:Frown|Happy|Neutral|Sad|Smile|Wink|Content|Id|Hipster|Frownidiot)?$|Eye(?!Off)|Mood)/,
    ),
  },
  {
    id: 'layout',
    label: 'Layout',
    matches: matchesAny(
      /^(Layout|Grid|Columns|Rows|Align|Distribute|Maximize|Minimize|Move|Reorder|Group|Frame|Drag|ContainerIcon|SidebarToggle|SidebarLeft|SidebarRight|MenuOpen|MenuClose|MenuFold)/,
    ),
  },
  {
    id: 'development',
    label: 'Development',
    matches: matchesAny(
      /^(Code|Terminal|Bug|Branch|Git|Cpu|Brackets|Variable|Build|Container|Cube|Database|CloudCode)/,
    ),
  },
  {
    id: 'shapes',
    label: 'Shapes',
    matches: matchesAny(
      /^(Square|Circle|Triangle|Hexagon|Octagon|Pentagon|Star|Heart|Cube|Sphere|Cylinder|Rhombus|Diamond)$/,
    ),
  },
  {
    id: 'alerts',
    label: 'Alerts & feedback',
    matches: matchesAny(
      /^(Alert|Bell|InfoCircle|InfoHexagon|InfoOctagon|InfoSquare|HelpCircle|HelpHexagon|HelpOctagon|HelpSquare|AnnotationAlert|AnnotationInfo|AnnotationQuestion|QuestionMark|Notification(?!s$))/,
    ),
  },
  {
    id: 'general',
    label: 'General',
    matches: matchesAny(
      /^(Plus|Minus|X(?:Close|Square|Circle)?$|Check|Search|Settings|Edit|Delete|Trash|Save|Refresh|Rotate|Filter|Sort|More|Menu|Home|Sliders|Lightbulb|Toggle|PowerButton|Magnet|Compass|Heart|Bookmark|Star|Flag|Eye|Wand|Tool|Wrench|Hammer|Scissors|Cursor|Hand|Click|Pointer|Tap|Touch|ToggleSwitch|UploadCloud|DownloadCloud|Loading|RefreshDouble|Award|Bookmark|Cog)/,
    ),
  },
];

function categorizeIcon(name: string): string {
  for (const category of ICON_CATEGORIES) {
    if (category.matches(name)) return category.id;
  }
  return 'other';
}

/** Group an iterable of icon names into ordered category buckets. */
export function groupByCategory(names: readonly string[]): {
  category: IconCategory | { id: 'other'; label: 'Other'; matches: () => false };
  icons: readonly string[];
}[] {
  const buckets = new Map<string, string[]>();
  for (const name of names) {
    const id = categorizeIcon(name);
    let bucket = buckets.get(id);
    if (bucket === undefined) {
      bucket = [];
      buckets.set(id, bucket);
    }
    bucket.push(name);
  }

  const ordered: ReturnType<typeof groupByCategory> = [];
  for (const category of ICON_CATEGORIES) {
    const icons = buckets.get(category.id);
    if (icons !== undefined && icons.length > 0) {
      ordered.push({ category, icons });
    }
  }
  const otherBucket = buckets.get('other');
  if (otherBucket !== undefined && otherBucket.length > 0) {
    ordered.push({
      category: { id: 'other', label: 'Other', matches: () => false as const },
      icons: otherBucket,
    });
  }
  return ordered;
}
