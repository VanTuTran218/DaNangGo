/** Short Vietnamese dish names must retain accents: lẩu≠lâu, chè≠chế, kem≠kèm. */
export function catalogFoodMatch(value: string, term: string): boolean {
  const clean = (text: string) => {
    const normalized = text.normalize("NFC").toLocaleLowerCase("vi-VN");
    return term.trim().length <= 3 ? normalized : normalized.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g,"d");
  };
  const escaped = clean(term).replace(/[.*+?^${}()|[\]\\]/g,"\\$&");
  return new RegExp(`(^|[^\\p{L}\\p{N}])${escaped}($|[^\\p{L}\\p{N}])`,"u").test(clean(value));
}
