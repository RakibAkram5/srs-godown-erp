import { settingsRepository } from '@/repositories/settings.repository';
import type { UpdateSettingsInput } from '@/validators/settings.validator';

async function ensureSettings() {
  const existing = await settingsRepository.getFirst();
  if (existing) return existing;
  return settingsRepository.create({ companyName: 'SRS Godown ERP' });
}

export const settingsService = {
  get() {
    return ensureSettings();
  },
  async getBranding() {
    const s = await ensureSettings();
    return { companyName: s.companyName, companyLogo: s.companyLogo };
  },
  async update(input: UpdateSettingsInput) {
    const current = await ensureSettings();
    return settingsRepository.update(current.id, input);
  },
};
