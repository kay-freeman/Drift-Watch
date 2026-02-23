import { z } from 'zod';

const RuleSchema = z.object({
  id: z.string(),
  port: z.number(),
  protocol: z.enum(['tcp', 'udp', 'icmp']),
});

type Rule = z.infer<typeof RuleSchema>;

describe('DriftWatch Detection Logic', () => {
  
  const policyRules: Rule[] = [
    { id: 'web-in', port: 80, protocol: 'tcp' },
    { id: 'ssh-in', port: 22, protocol: 'tcp' }
  ];

  test('Detection: Should identify a missing rule', () => {
    const liveRules: Rule[] = [
      { id: 'web-in', port: 80, protocol: 'tcp' }
    ];

    const missing = policyRules.filter(
      p => !liveRules.some(l => l.id === p.id && l.port === p.port)
    );

    expect(missing.length).toBe(1);
    expect(missing[0].id).toBe('ssh-in');
  });

  test('Detection: Should identify an extra (unauthorized) rule', () => {
    const liveRules: Rule[] = [
      { id: 'web-in', port: 80, protocol: 'tcp' },
      { id: 'ssh-in', port: 22, protocol: 'tcp' },
      { id: 'rogue-access', port: 4444, protocol: 'tcp' }
    ];

    const extra = liveRules.filter(
      l => !policyRules.some(p => p.id === l.id && p.port === l.port)
    );

    expect(extra.length).toBe(1);
    expect(extra[0].id).toBe('rogue-access');
  });
});