import { mulberry32 } from "./random";

export const triageSamples = [
  {
    id: "lure",
    title: "Credential lure",
    family: "Credential harvest",
    y: 1 as 0 | 1,
    text: "Unusual activity on your account. Verify your password immediately at http://203.0.113.44/login or we will suspend access.",
  },
  {
    id: "it-reminder",
    title: "IT password reminder",
    family: "IT notice",
    y: 0 as 0 | 1,
    text: "Scheduled reminder from IT Service Desk: your password will expire in 7 days. Reset it at https://help.example.com/password after you sign in to the self-service portal.",
  },
  {
    id: "bec",
    title: "Wire request",
    family: "Impersonation",
    y: 1 as 0 | 1,
    text: "I am in meetings all afternoon. Please send a wire transfer to this beneficiary today and keep it confidential. I will explain later.",
  },
  {
    id: "meeting",
    title: "Meeting invite",
    family: "Calendar",
    y: 0 as 0 | 1,
    text: "Calendar: weekly standup is scheduled tomorrow at 10:00. The agenda is attached. No account or password action is required.",
  },
  {
    id: "lookalike",
    title: "Lookalike payroll",
    family: "Lookalike domain",
    y: 1 as 0 | 1,
    text: "Payroll operations: update your direct deposit at https://payroll-example.test/deposit before Friday to avoid a delayed cycle.",
  },
] as const;

export type TriageSampleId = (typeof triageSamples)[number]["id"];

const TOKEN_FEATURES = [
  "password", "reset", "verify", "account", "invoice", "payment", "wire",
  "urgent", "click", "login", "credential", "suspend", "unusual", "gift",
  "meeting", "agenda", "shipment", "tracking", "ticket", "scheduled",
  "newsletter", "payroll", "confidential", "immediately", "mailbox",
  "quota", "beneficiary", "overdue", "deposit", "restore", "lockout",
  "transfer", "reminder", "standup", "calendar", "facilities", "expires",
  "activity", "identity", "codes", "portal", "service", "desk",
] as const;

const URL_FEATURES = ["url_ip"] as const;
const FEATURES = [...TOKEN_FEATURES, ...URL_FEATURES] as const;
const featureIndex = new Map(FEATURES.map((name, index) => [name, index]));
const featureCount = FEATURES.length;
const sigmoid = (value: number) => 1 / (1 + Math.exp(-Math.max(-30, Math.min(30, value))));

type Report = { text: string; y: 0 | 1; family: string };

const people = ["Jordan Hale", "Casey Quinn", "Morgan Lee", "Avery Cole", "Sam Ortiz", "Riley Park"];
const tickets = ["INC-1842", "REQ-3301", "CHG-2044", "INC-2099", "REQ-4410"];
const noise = [
  "Thanks.",
  "Please advise.",
  "Looping the team.",
  "Sent from my laptop.",
  "Can you take a look?",
];

const phishingTemplates: Array<(random: () => number) => Report> = [
  random => ({
    family: "Credential harvest",
    y: 1,
    text: `Unusual activity on your account. Verify your password immediately at http://203.0.113.${10 + Math.floor(random() * 80)}/login or we will suspend access.`,
  }),
  random => ({
    family: "Lookalike domain",
    y: 1,
    text: `Payroll operations: update your direct deposit at https://payroll-example.test/deposit?ref=${Math.floor(random() * 9000)} before Friday.`,
  }),
  random => ({
    family: "Shortener",
    y: 1,
    text: `Your mailbox quota is full. Click https://lnk.test/${Math.floor(random() * 9999).toString(16)} to restore access immediately.`,
  }),
  random => ({
    family: "Invoice lure",
    y: 1,
    text: `Invoice ${Math.floor(1800 + random() * 400)} is overdue. Pay now at https://login-example.test/invoice to avoid interruption.`,
  }),
  () => ({
    family: "Impersonation",
    y: 1,
    text: "I am traveling today. Please send a wire transfer to this beneficiary and keep it confidential. I will explain later.",
  }),
  random => ({
    family: "Credential harvest",
    y: 1,
    text: `Confirm your identity to keep your account. Password expires today. http://tiny.test/${Math.floor(random() * 9999).toString(16)}`,
  }),
  random => ({
    family: "Lookalike domain",
    y: 1,
    text: `IT: reset your credential at https://examp1e.test/reset?uid=${Math.floor(random() * 500)} or lockout will begin.`,
  }),
  () => ({
    family: "Gift request",
    y: 1,
    text: "Need gift cards for a client meeting. Purchase five and send the codes immediately. Keep this off the ticket system.",
  }),
  random => ({
    family: "Shortener",
    y: 1,
    text: `We detected unusual activity. Verify your account to prevent lockout: https://cut.test/${Math.floor(random() * 9999).toString(16)}`,
  }),
  random => ({
    family: "Lookalike domain",
    y: 1,
    text: `Shared file waiting. Login at https://share-example.test/doc/${Math.floor(random() * 800)} to review the payment.`,
  }),
  () => ({
    family: "Impersonation",
    y: 1,
    text: "Can you process this vendor payment while I am offline this afternoon? I will catch up later.",
  }),
  () => ({
    family: "Gift request",
    y: 1,
    text: "Quick favor if you have a minute — grab store codes for the client visit. I cannot reach payroll.",
  }),
];

const benignTemplates: Array<(random: () => number) => Report> = [
  random => ({
    family: "IT notice",
    y: 0,
    text: `Scheduled reminder from IT Service Desk: your password will expire in ${3 + Math.floor(random() * 12)} days. Reset it at https://help.example.com/password after you sign in to the self-service portal.`,
  }),
  () => ({
    family: "Calendar",
    y: 0,
    text: "Calendar: weekly standup is scheduled tomorrow at 10:00. The agenda is attached. No account or password action is required.",
  }),
  random => ({
    family: "Logistics",
    y: 0,
    text: `Shipment ${Math.floor(44000 + random() * 2000)} is out for delivery. Tracking is available at https://mail.example.com/tracking.`,
  }),
  random => ({
    family: "Ticketing",
    y: 0,
    text: `Ticket ${pick(tickets, random)} has been updated by the service desk. No password or login action is required.`,
  }),
  () => ({
    family: "Facilities",
    y: 0,
    text: "Newsletter: facilities will close the east garage on Friday. Unsubscribe at https://mail.example.com/news.",
  }),
  () => ({
    family: "Internal share",
    y: 0,
    text: "The Q3 close library is ready. Open it from https://share.example.com/q3 after the standard VPN sign-in.",
  }),
  () => ({
    family: "IT notice",
    y: 0,
    text: "Your MFA device was successfully enrolled. If you did not request this, contact IT Service Desk — do not click unexpected links.",
  }),
  () => ({
    family: "Payroll",
    y: 0,
    text: "Payroll operations processed the regular cycle. Pay slips are in https://share.example.com/payslips.",
  }),
  () => ({
    family: "Calendar",
    y: 0,
    text: "Please review the attached agenda for Thursday's architecture review. No action on accounts.",
  }),
  () => ({
    family: "IT notice",
    y: 0,
    text: "VPN maintenance window Saturday 02:00–04:00. Connect after the window using the standard client.",
  }),
  random => ({
    family: "Welcome",
    y: 0,
    text: `Welcome to the team, ${pick(people, random).split(" ")[0]}. Your account is ready. Collect your laptop from facilities.`,
  }),
  () => ({
    family: "Facilities",
    y: 0,
    text: "The invoice from Facilities for badge printing has been posted internally. No external payment link.",
  }),
  () => ({
    family: "IT notice",
    y: 0,
    text: "We blocked unusual activity on your account. No password reset is required. Contact IT Service Desk if this was you.",
  }),
  () => ({
    family: "Logistics",
    y: 0,
    text: "Click the tracking link at https://mail.example.com/tracking if you want shipment status. This is not a login request.",
  }),
  () => ({
    family: "Ticketing",
    y: 0,
    text: "Ticket INC-1842 notes host FIN-LT-042 at 10.20.4.42 came back online. No password or login action is required.",
  }),
];

function pick<T>(items: readonly T[], random: () => number) {
  return items[Math.floor(random() * items.length)]!;
}

function decorate(text: string, y: 0 | 1, random: () => number) {
  const addressee = pick(people, random);
  const extra = random() < .45 ? ` ${pick(noise, random)}` : "";
  const leak = y === 0 && random() < .22
    ? ` ${pick(["Verify your account if this looks wrong.", "Unusual activity was mentioned in passing.", "Do not send a wire transfer from this thread.", "No need to click a login page."], random)}`
    : y === 1 && random() < .22
      ? ` ${pick(["This arrived on the scheduled reminder channel.", "See the standup agenda if needed.", "IT Service Desk is copied.", "Tracking is also in the ticket."], random)}`
      : "";
  return `Hi ${addressee}, ${text}${leak}${extra}`;
}

function createInbox(count: number, seed: number): Report[] {
  const random = mulberry32(seed);
  return Array.from({ length: count }, () => {
    const y = (random() < .3 ? 1 : 0) as 0 | 1;
    const template = pick(y ? phishingTemplates : benignTemplates, random);
    const report = template(random);
    return { ...report, text: decorate(report.text, y, random) };
  });
}

function tokenize(text: string) {
  return text.toLowerCase().match(/[a-z][a-z0-9]{2,}/g) ?? [];
}

function urlFlags(text: string) {
  return {
    url_ip: /\b(?:\d{1,3}\.){3}\d{1,3}\b/.test(text) ? 1 : 0,
  } as const;
}

function featurize(text: string) {
  const values = Array<number>(featureCount).fill(0);
  for (const token of new Set(tokenize(text))) {
    const index = featureIndex.get(token as (typeof TOKEN_FEATURES)[number]);
    if (index !== undefined) values[index] = 1;
  }
  const flags = urlFlags(text);
  for (const name of URL_FEATURES) values[featureIndex.get(name)!] = flags[name];
  return values;
}

type Model = { weights: number[]; bias: number };

function trainLogistic(samples: Report[]): Model {
  const encoded = samples.map(sample => ({ x: featurize(sample.text), y: sample.y }));
  const weights = Array(featureCount).fill(0);
  let bias = 0;
  for (let epoch = 0; epoch < 160; epoch++) {
    const gradients = Array(featureCount).fill(0);
    let biasGradient = 0;
    for (const sample of encoded) {
      const probability = sigmoid(bias + weights.reduce((sum, weight, index) => sum + weight * sample.x[index], 0));
      const error = probability - sample.y;
      biasGradient += error;
      for (let index = 0; index < featureCount; index++) gradients[index] += error * sample.x[index];
    }
    const rate = .9 / samples.length;
    bias -= rate * biasGradient;
    for (let index = 0; index < featureCount; index++) weights[index] -= rate * (gradients[index] + .06 * weights[index]);
  }
  return { weights, bias };
}

function logit(model: Model, values: number[]) {
  return model.bias + model.weights.reduce((sum, weight, index) => sum + weight * values[index], 0);
}

function predict(model: Model, text: string) {
  const values = featurize(text);
  const score = logit(model, values);
  return { values, logit: score, probability: sigmoid(score) };
}

function keywordRule(text: string) {
  const lower = text.toLowerCase();
  if (lower.includes("password") && lower.includes("http")) return 1;
  if (lower.includes("click") && lower.includes("http")) return 1;
  if (/\b(?:lnk|tiny|cut)\.test\b|(?:\d{1,3}\.){3}\d{1,3}/.test(lower)) return 1;
  if (lower.includes("verify your account") || lower.includes("unusual activity")) return 1;
  return 0;
}

type Confusion = { tp: number; fp: number; tn: number; fn: number };

function confusionFrom(samples: Report[], decide: (text: string) => number): Confusion {
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const sample of samples) {
    const positive = decide(sample.text);
    if (positive && sample.y) tp++;
    else if (positive) fp++;
    else if (sample.y) fn++;
    else tn++;
  }
  return { tp, fp, tn, fn };
}

function fromConfusion(confusion: Confusion) {
  const { tp, fp, tn, fn } = confusion;
  const precision = tp / Math.max(1, tp + fp);
  const recall = tp / Math.max(1, tp + fn);
  const trueNegativeRate = tn / Math.max(1, tn + fp);
  const workload = (tp + fp) / Math.max(1, tp + fp + tn + fn);
  return {
    precision, recall, trueNegativeRate, workload,
    workloadReduction: 1 - workload,
    f1: 2 * precision * recall / Math.max(.0001, precision + recall),
    confusion,
  };
}

function histogram(scores: number[], bins = 10) {
  const counts = Array(bins).fill(0);
  for (const score of scores) counts[Math.min(bins - 1, Math.floor(score * bins))]++;
  return counts;
}

const featureLabels: Record<(typeof FEATURES)[number], string> = {
  password: "password", reset: "reset", verify: "verify", account: "account", invoice: "invoice",
  payment: "payment", wire: "wire", urgent: "urgent", click: "click", login: "login",
  credential: "credential", suspend: "suspend", unusual: "unusual", gift: "gift", meeting: "meeting",
  agenda: "agenda", shipment: "shipment", tracking: "tracking", ticket: "ticket", scheduled: "scheduled",
  newsletter: "newsletter", payroll: "payroll", confidential: "confidential", immediately: "immediately",
  mailbox: "mailbox", quota: "quota", beneficiary: "beneficiary", overdue: "overdue", deposit: "deposit",
  restore: "restore", lockout: "lockout", transfer: "transfer", reminder: "reminder", standup: "standup",
  calendar: "calendar", facilities: "facilities", expires: "expires", activity: "activity", identity: "identity",
  codes: "codes", portal: "portal", service: "service", desk: "desk",
  url_ip: "IP URL",
};

function scoreMetrics(samples: Report[], decide: (text: string) => number) {
  return fromConfusion(confusionFrom(samples, decide));
}

const training = createInbox(1200, 7711);
const testing = createInbox(600, 8822);
const champion = trainLogistic(training);
const ruleMetrics = scoreMetrics(testing, keywordRule);

function explain(text: string, label?: 0 | 1, title?: string, family?: string) {
  const { values, probability } = predict(champion, text);
  const contributions = FEATURES.map((feature, index) => ({
    feature: featureLabels[feature],
    key: feature,
    value: values[index],
    contribution: Number((champion.weights[index] * values[index]).toFixed(3)),
  })).filter(item => item.value).sort((a, b) => Math.abs(b.contribution) - Math.abs(a.contribution));
  const bias = Number(champion.bias.toFixed(3));
  return {
    text, title, family, label,
    probability: Number(probability.toFixed(3)),
    logit: Number((bias + contributions.reduce((sum, item) => sum + item.contribution, 0)).toFixed(3)),
    bias,
    contributions,
    tokens: tokenize(text),
  };
}

export function runTriageLab(threshold = .35, sampleId: string = "lure", text?: string) {
  const clamped = Math.min(.9, Math.max(.1, threshold));
  const modelMetrics = scoreMetrics(testing, report => predict(champion, report).probability >= clamped ? 1 : 0);
  const scores = testing.map(sample => ({ y: sample.y, p: predict(champion, sample.text).probability }));
  const selected = triageSamples.find(sample => sample.id === sampleId) ?? triageSamples[0];
  const report = text?.trim() ? explain(text.trim()) : explain(selected.text, selected.y, selected.title, selected.family);
  const decision = report.probability >= clamped ? "Send to analyst" : "Auto-close";
  return {
    dataset: { trainRows: training.length, testRows: testing.length, features: featureCount, seed: 7711, phishingRate: Number((testing.filter(sample => sample.y).length / testing.length).toFixed(3)) },
    controls: { threshold: clamped, sampleId: text?.trim() ? "custom" : selected.id },
    model: { type: "L2-regularized logistic regression", epochs: 160, features: featureCount },
    metrics: {
      trueNegativeRate: Number(modelMetrics.trueNegativeRate.toFixed(3)),
      recall: Number(modelMetrics.recall.toFixed(3)),
      precision: Number(modelMetrics.precision.toFixed(3)),
      f1: Number(modelMetrics.f1.toFixed(3)),
      workload: Number(modelMetrics.workload.toFixed(3)),
      workloadReduction: Number(modelMetrics.workloadReduction.toFixed(3)),
      missed: modelMetrics.confusion.fn,
      confusion: modelMetrics.confusion,
    },
    baseline: {
      name: "Keyword and URL rules",
      type: "heuristic",
      trueNegativeRate: Number(ruleMetrics.trueNegativeRate.toFixed(3)),
      recall: Number(ruleMetrics.recall.toFixed(3)),
      precision: Number(ruleMetrics.precision.toFixed(3)),
      f1: Number(ruleMetrics.f1.toFixed(3)),
      workload: Number(ruleMetrics.workload.toFixed(3)),
      confusion: ruleMetrics.confusion,
    },
    distribution: {
      bins: 10,
      benign: histogram(scores.filter(item => item.y === 0).map(item => item.p)),
      phishing: histogram(scores.filter(item => item.y === 1).map(item => item.p)),
    },
    samples: triageSamples.map(({ id, title, family, y }) => ({ id, title, family, label: y })),
    report: { ...report, decision },
  };
}
