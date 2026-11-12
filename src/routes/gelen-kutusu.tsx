import { useState, useEffect, useRef } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Inbox, CheckCircle, XCircle, RefreshCw, Upload, Clock, User, MessageSquare, AlertCircle, Eye, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useFieldData } from "@/lib/field-data";
import { useI18n } from "@/lib/i18n";
import {
  getLocalSubmissions,
  fetchSubmissionsFromCloud,
  approveSubmission,
  rejectSubmission,
  importSubmissionFile,
  type FieldSubmission
} from "@/lib/submissions";

export const Route = createFileRoute("/gelen-kutusu")({
  head: () => ({
    meta: [
      { title: "Gelen Kutusu — GES Saha İmalat Takip" },
      { name: "description", content: "Sahadan iletilen imalat raporlarını onaylayın ve projeye dahil edin." }
    ]
  }),
  component: InboxPage
});

function InboxPage() {
  const { t } = useI18n();
  const { importData, items } = useFieldData();
  const [submissions, setSubmissions] = useState<FieldSubmission[]>(() => getLocalSubmissions());
  const [activeTab, setActiveTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [syncing, setSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadSubmissions = () => {
    setSubmissions(getLocalSubmissions());
  };

  const handleCloudSync = async () => {
    setSyncing(true);
    const toastId = toast.loading("Buluttan gelen raporlar taranıyor...");
    try {
      const res = await fetchSubmissionsFromCloud();
      if (res.success) {
        toast.success(res.message, { id: toastId });
        loadSubmissions();
      } else {
        toast.error(res.message, { id: toastId });
      }
    } catch {
      toast.error("Bulut sorgusu başarısız oldu.", { id: toastId });
    } finally {
      setSyncing(false);
    }
  };

  const handleApprove = async (sub: FieldSubmission) => {
    if (!confirm(`"${sub.senderName}" tarafından iletilen imalat verilerini onaylayıp ana projeye dahil etmek istediğinize emin misiniz?`)) {
      return;
    }

    const res = await approveSubmission(sub, (changes) => {
      importData(changes);
    });

    if (res.success) {
      toast.success(res.message);
      loadSubmissions();
    } else {
      toast.error(res.message);
    }
  };

  const handleReject = async (sub: FieldSubmission) => {
    if (!confirm(`"${sub.senderName}" tarafından iletilen raporu reddetmek istediğinize emin misiniz?`)) {
      return;
    }

    const res = await rejectSubmission(sub);
    if (res.success) {
      toast.info(res.message);
      loadSubmissions();
    } else {
      toast.error(res.message);
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const res = await importSubmissionFile(file);
    if (res.success) {
      toast.success(res.message);
      loadSubmissions();
      setActiveTab("pending");
    } else {
      toast.error(res.message);
    }

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const pendingList = submissions.filter(s => s.status === "pending");
  const approvedList = submissions.filter(s => s.status === "approved");
  const rejectedList = submissions.filter(s => s.status === "rejected");

  const currentList = activeTab === "pending" ? pendingList : activeTab === "approved" ? approvedList : rejectedList;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight">{t("Gelen Kutusu")}</h2>
            {pendingList.length > 0 && (
              <Badge variant="destructive" className="rounded-full px-2.5 py-0.5 text-xs font-bold animate-pulse">
                {pendingList.length} Yeni Rapor
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Sahadan mobil uygulama üzerinden iletilen imalat raporlarını inceleyin ve onaylayarak projeye dahil edin.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloudSync}
            disabled={syncing}
            className="h-10 gap-1.5"
          >
            <RefreshCw className={`size-4 ${syncing ? "animate-spin" : ""}`} />
            <span>Buluttan Çek</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-10 gap-1.5"
          >
            <Upload className="size-4" />
            <span>Dosyadan Al (.gessub)</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".gessub,.json"
            onChange={handleFileImport}
            className="hidden"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as typeof activeTab)} className="space-y-4">
        <TabsList className="grid grid-cols-3 max-w-md h-11">
          <TabsTrigger value="pending" className="gap-2 text-xs font-semibold">
            <span>Onay Bekleyenler</span>
            {pendingList.length > 0 && (
              <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground font-bold">
                {pendingList.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-1.5 text-xs font-semibold">
            <span>Onaylananlar</span>
            <span className="text-[11px] opacity-70">({approvedList.length})</span>
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-1.5 text-xs font-semibold">
            <span>Reddedilenler</span>
            <span className="text-[11px] opacity-70">({rejectedList.length})</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 pt-2">
          {currentList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
              <Inbox className="size-12 text-muted-foreground/40 mb-3" />
              <h3 className="text-base font-semibold">Bu sekmede rapor bulunmuyor</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {activeTab === "pending"
                  ? "Sahadan yeni bir imalat raporu gönderildiğinde burada listelenecektir. Buluttan yeni veri çekmek için 'Buluttan Çek' butonunu kullanabilirsiniz."
                  : "Geçmiş rapor kayıtları burada arşivlenir."}
              </p>
            </div>
          ) : (
            currentList.map(item => {
              const isExpanded = expandedId === item.id;
              const dateDisplay = new Date(item.timestamp).toLocaleString("tr-TR");
              const tableEntries = Object.entries(item.changes);

              return (
                <div
                  key={item.id}
                  className={`rounded-lg border bg-card p-5 shadow-sm transition-all ${
                    item.status === "pending" ? "border-primary/40 bg-card hover:border-primary" : "opacity-85"
                  }`}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-base flex items-center gap-1.5">
                          <User className="size-4 text-primary" />
                          {item.senderName}
                        </span>

                        {item.status === "pending" && (
                          <Badge variant="outline" className="border-amber-500/40 bg-amber-500/10 text-amber-500 text-[11px] font-semibold gap-1">
                            <Clock className="size-3" />
                            Onay Bekliyor
                          </Badge>
                        )}
                        {item.status === "approved" && (
                          <Badge variant="outline" className="border-success/40 bg-success/10 text-success text-[11px] font-semibold gap-1">
                            <CheckCircle className="size-3" />
                            Onaylandı
                          </Badge>
                        )}
                        {item.status === "rejected" && (
                          <Badge variant="outline" className="border-destructive/40 bg-destructive/10 text-destructive text-[11px] font-semibold gap-1">
                            <XCircle className="size-3" />
                            Reddedildi
                          </Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span>{dateDisplay}</span>
                        <span>•</span>
                        <span className="font-medium text-foreground">{item.summaryText}</span>
                      </p>
                    </div>

                    {item.status === "pending" && (
                      <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0">
                        <Button
                          size="sm"
                          onClick={() => handleApprove(item)}
                          className="h-9 gap-1.5 bg-success hover:bg-success/90 text-white font-medium"
                        >
                          <Check className="size-4" />
                          Onayla ve Dahil Et
                        </Button>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleReject(item)}
                          className="h-9 gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <XCircle className="size-4" />
                          Reddet
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Note */}
                  {item.note && (
                    <div className="mt-3 rounded bg-muted/60 p-2.5 text-xs text-muted-foreground flex items-start gap-2">
                      <MessageSquare className="size-3.5 text-primary shrink-0 mt-0.5" />
                      <span>{item.note}</span>
                    </div>
                  )}

                  {/* Detail toggle */}
                  <div className="mt-3 border-t pt-3 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="size-3.5" /> Detayları Gizle
                        </>
                      ) : (
                        <>
                          <ChevronDown className="size-3.5" /> İmalat Detaylarını İncele ({tableEntries.length} Masa)
                        </>
                      )}
                    </button>

                    {item.reviewedAt && (
                      <span className="text-[11px] text-muted-foreground">
                        {item.reviewedBy} • {new Date(item.reviewedAt).toLocaleString("tr-TR")}
                      </span>
                    )}
                  </div>

                  {/* Expanded Table Details */}
                  {isExpanded && (
                    <div className="mt-3 overflow-x-auto rounded border">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-muted font-semibold text-muted-foreground">
                          <tr>
                            <th className="p-2 border-r">Masa Konumu</th>
                            {items.map(i => (
                              <th key={i.name} className="p-2 border-r text-center">
                                {i.name} (Hedef: {i.target})
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y font-mono">
                          {tableEntries.map(([key, vals]) => {
                            const [s, z, r, t] = key.split("-").map(Number);
                            const label = `İstasyon ${(s ?? 0) + 1} › Bölge ${["A", "B", "C", "D"][z ?? 0]} › Sıra ${(r ?? 0) + 1} › Masa ${(t ?? 0) + 1}`;
                            return (
                              <tr key={key} className="hover:bg-muted/40">
                                <td className="p-2 font-sans font-medium border-r whitespace-nowrap">{label}</td>
                                {items.map((item, idx) => (
                                  <td key={item.name} className="p-2 border-r text-center font-bold text-primary">
                                    {vals[idx] ?? 0}
                                  </td>
                                ))}
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
