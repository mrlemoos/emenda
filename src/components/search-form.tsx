export function SearchForm({ large = false, defaultValue = "" }: { large?: boolean; defaultValue?: string }) {
  return (
    <form className={large ? "search search-large" : "search"} action="/buscar">
      <label htmlFor="q">Busque sua cidade, uma instituição ou um parlamentar</label>
      <div><input id="q" name="q" defaultValue={defaultValue} placeholder="Ex.: Florianópolis" required /><button type="submit">Buscar →</button></div>
    </form>
  );
}
