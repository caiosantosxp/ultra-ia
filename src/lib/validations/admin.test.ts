import { createSpecialistSchema, fileUploadSchema, updateSpecialistSchema } from './admin';

const validSpecialist = {
  name: 'Expert Juridique',
  slug: 'expert-juridique',
  domain: 'Droit des affaires',
  description: 'Un expert en droit des affaires avec 20 ans d\'expérience',
  price: 990,
  accentColor: '#6366f1',
  avatarUrl: 'https://example.com/avatar.png',
  tags: ['droit', 'contrats'],
  quickPrompts: ['Comment rédiger un contrat ?'],
  systemPrompt: 'Vous êtes un expert juridique.',
  scopeLimits: 'Droit des affaires uniquement.',
};

describe('createSpecialistSchema', () => {
  it('valide un specialist complet', () => {
    const result = createSpecialistSchema.safeParse(validSpecialist);
    expect(result.success).toBe(true);
  });

  it('rejette un nom trop court', () => {
    const result = createSpecialistSchema.safeParse({ ...validSpecialist, name: 'A' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('2 caractères');
  });

  it('rejette un slug invalide (avec espaces)', () => {
    const result = createSpecialistSchema.safeParse({ ...validSpecialist, slug: 'invalid slug' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('Slug invalide');
  });

  it('rejette un prix inférieur à 100', () => {
    const result = createSpecialistSchema.safeParse({ ...validSpecialist, price: 50 });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('1€');
  });

  it('rejette une couleur invalide', () => {
    const result = createSpecialistSchema.safeParse({ ...validSpecialist, accentColor: 'rouge' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('hexadécimale');
  });

  it('rejette une URL d\'avatar invalide', () => {
    const result = createSpecialistSchema.safeParse({ ...validSpecialist, avatarUrl: 'not-a-url' });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('URL invalide');
  });

  it('accepte les champs optionnels absents', () => {
    const { systemPrompt: _sp, scopeLimits: _sl, ...withoutOptional } = validSpecialist;
    const result = createSpecialistSchema.safeParse(withoutOptional);
    expect(result.success).toBe(true);
  });
});

describe('updateSpecialistSchema', () => {
  it('accepte un objet vide (tous les champs optionnels)', () => {
    const result = updateSpecialistSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('valide une mise à jour partielle', () => {
    const result = updateSpecialistSchema.safeParse({ name: 'Nouveau nom', price: 1990 });
    expect(result.success).toBe(true);
  });
});

describe('fileUploadSchema', () => {
  it('valide un fichier PDF valide', () => {
    const result = fileUploadSchema.safeParse({
      fileName: 'document.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024 * 1024, // 1 MB
    });
    expect(result.success).toBe(true);
  });

  it('rejette un type MIME non autorisé', () => {
    const result = fileUploadSchema.safeParse({
      fileName: 'image.jpg',
      mimeType: 'image/jpeg',
      fileSize: 1024,
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('PDF, TXT, DOCX');
  });

  it('rejette un fichier trop volumineux', () => {
    const result = fileUploadSchema.safeParse({
      fileName: 'big.pdf',
      mimeType: 'application/pdf',
      fileSize: 6 * 1024 * 1024, // 6 MB
    });
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain('5 Mo');
  });

  it('valide TXT et DOCX', () => {
    const txt = fileUploadSchema.safeParse({
      fileName: 'file.txt',
      mimeType: 'text/plain',
      fileSize: 512,
    });
    const docx = fileUploadSchema.safeParse({
      fileName: 'file.docx',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      fileSize: 2048,
    });
    expect(txt.success).toBe(true);
    expect(docx.success).toBe(true);
  });
});
