import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/data/accounts";
import { PageHeader } from "@/components/shared/page-header";
import { CsvImportWizard } from "@/components/import/csv-import-wizard";
import { EmptyState } from "@/components/shared/empty-state";
import { Wallet } from "lucide-react";

export default async function ImportPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const accounts = await getAccounts(supabase, user.id);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader
        title="Import CSV"
        description="Importe l'historique de transactions exporté par ta banque."
      />
      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Crée d'abord un compte"
          description="Un compte est nécessaire pour associer les transactions importées."
        />
      ) : (
        <CsvImportWizard accounts={accounts} />
      )}
    </div>
  );
}
