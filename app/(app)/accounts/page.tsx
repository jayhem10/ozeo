import { Archive, Wallet } from "lucide-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getAccounts } from "@/lib/data/accounts";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { AccountCard } from "@/components/accounts/account-card";
import { AccountFormDialog } from "@/components/accounts/account-form-dialog";
import { ArchiveAccountButton } from "@/components/accounts/archive-account-button";

export default async function AccountsPage() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const accounts = await getAccounts(supabase, user.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Comptes"
        description="Gère tes comptes et suis leur solde en temps réel."
        action={<AccountFormDialog />}
      />

      {accounts.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Aucun compte"
          description="Crée ton premier compte pour commencer à suivre tes finances."
          action={<AccountFormDialog />}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {accounts.map((account) => (
            <AccountCard key={account.id} account={account}>
              <div className="flex items-center gap-1">
                <AccountFormDialog account={account} />
                <ArchiveAccountButton accountId={account.id}>
                  <Archive className="size-4" />
                </ArchiveAccountButton>
              </div>
            </AccountCard>
          ))}
        </div>
      )}
    </div>
  );
}
