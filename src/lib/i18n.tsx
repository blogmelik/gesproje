import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Language = "tr" | "en" | "fr";
export const LANGUAGE_STORAGE_KEY = "ges-language-v1";
export const LANGUAGES: { value: Language; label: string }[] = [
  { value: "tr", label: "Türkçe" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
];
export const LOCALES: Record<Language, string> = { tr: "tr-TR", en: "en-GB", fr: "fr-FR" };

export function parseLanguage(raw: string | null): Language {
  return raw === "en" || raw === "fr" ? raw : "tr";
}

// Turkish source text -> [English, French]
const DICT: Record<string, [string, string]> = {
  "Genel Bakış": ["Overview", "Vue d'ensemble"],
  "İlerleme": ["Progress", "Avancement"],
  "Kayıt et": ["Save", "Enregistrer"],
  "Saha Gezgini": ["Site Explorer", "Explorateur du site"],
  "Soldan bir masa seçin": ["Select a table on the left", "Sélectionnez une table à gauche"],
  "Toplam": ["Total", "Total"],
  "Senkronize": ["Synced", "Synchronisé"],
  "Kaydedilmemiş": ["Unsaved", "Non enregistré"],
  "Saha Hava Durumu": ["Site weather", "Météo du site"],
  "Kalem Bazlı İlerleme": ["Progress by item", "Avancement par élément"],
  "Genel %": ["Overall %", "Global %"],
  "İlerleme kaydedildi": ["Progress saved", "Avancement enregistré"],
  "Rapor Yönetimi": ["Report Management", "Gestion des rapports"],
  "Ayarlar": ["Settings", "Paramètres"],
  "Ana menü": ["Main menu", "Menu principal"],
  "Alt menü": ["Bottom menu", "Menu inférieur"],
  "Menüyü aç": ["Open menu", "Ouvrir le menu"],
  "Tema değiştir": ["Toggle theme", "Changer de thème"],
  "SAHA YÖNETİMİ": ["SITE MANAGEMENT", "GESTION DU CHANTIER"],
  "Saha Yönetimi": ["Site Management", "Gestion du chantier"],
  "Saha İmalat Takip": ["Site Production Tracking", "Suivi de production"],
  "36 istasyon · 10.368 masa": ["36 stations · 10,368 tables", "36 stations · 10 368 tables"],
  "Menüyü genişlet": ["Expand menu", "Développer le menu"],
  "Menüyü daralt": ["Collapse menu", "Réduire le menu"],
  "Dil": ["Language", "Langue"],
  // Dashboard
  "PROJE GENEL BAKIŞ": ["PROJECT OVERVIEW", "APERÇU DU PROJET"],
  "İlerleme Raporu (Excel)": ["Progress Report (Excel)", "Rapport d'avancement (Excel)"],
  "İlerleme raporu hazırlanıyor…": ["Preparing progress report…", "Préparation du rapport…"],
  "Rapor indirildi": ["Report downloaded", "Rapport téléchargé"],
  "saha_genel_ilerleme.xlsx — {n} masa listelendi.": ["saha_genel_ilerleme.xlsx — {n} tables listed.", "saha_genel_ilerleme.xlsx — {n} tables listées."],
  "Rapor oluşturulamadı": ["Report could not be created", "Impossible de créer le rapport"],
  "Lütfen tekrar deneyin.": ["Please try again.", "Veuillez réessayer."],
  "Genel Tamamlanma": ["Overall Completion", "Achèvement global"],
  "Tamamlanan Masa": ["Completed Tables", "Tables terminées"],
  "Biten İstasyon": ["Completed Stations", "Stations terminées"],
  "Başlamamış İst.": ["Not Started St.", "St. non commencées"],
  "İmalat İlerlemesi": ["Production Progress", "Avancement de la production"],
  "adet": ["pcs", "pcs"],
  "Kolon": ["Column", "Poteau"],
  "Kiriş": ["Beam", "Poutre"],
  "Payanda": ["Brace", "Contreventement"],
  "Aşık": ["Purlin", "Panne"],
  "Panel": ["Panel", "Panneau"],
  // Report
  "İstasyon Seçimi": ["Select Station", "Choix de la station"],
  "Bölge Seçimi": ["Select Zone", "Choix de la zone"],
  "Sıra Seçimi": ["Select Row", "Choix de la rangée"],
  "Masa İmalatları": ["Table Production", "Production des tables"],
  "Adım {n} / 4": ["Step {n} / 4", "Étape {n} / 4"],
  "Seçim yolu": ["Selection path", "Chemin de sélection"],
  "İstasyonlar": ["Stations", "Stations"],
  "İstasyon": ["Station", "Station"],
  "Bölge": ["Zone", "Zone"],
  "Sıra": ["Row", "Rangée"],
  "Masa": ["Table", "Table"],
  "İstasyon {n}": ["Station {n}", "Station {n}"],
  "Bölge {n}": ["Zone {n}", "Zone {n}"],
  "Sıra {n}": ["Row {n}", "Rangée {n}"],
  "Masa {n}": ["Table {n}", "Table {n}"],
  "Geri Dön": ["Go Back", "Retour"],
  "Hata Bildir": ["Report Fault", "Signaler un défaut"],
  "azalt": ["decrease", "diminuer"],
  "artır": ["increase", "augmenter"],
  "miktarı": ["quantity", "quantité"],
  "ilerleme": ["progress", "avancement"],
  // Revision
  "Açık": ["Open", "Ouvert"],
  "Kritik": ["Critical", "Critique"],
  "Giderildi": ["Resolved", "Résolu"],
  "Aktarılacak kayıt yok": ["No records to export", "Aucun enregistrement à exporter"],
  "Filtreleri değiştirip tekrar deneyin.": ["Change the filters and try again.", "Modifiez les filtres et réessayez."],
  "Excel indirildi": ["Excel downloaded", "Excel téléchargé"],
  "saha_hata_raporu.xlsx — {n} kayıt aktarıldı.": ["saha_hata_raporu.xlsx — {n} records exported.", "saha_hata_raporu.xlsx — {n} enregistrements exportés."],
  "Excel oluşturulamadı": ["Excel could not be created", "Impossible de créer l'Excel"],
  "{n} kayıt listeleniyor": ["{n} records listed", "{n} enregistrements affichés"],
  "Excel'e Aktar": ["Export to Excel", "Exporter vers Excel"],
  "Durum": ["Status", "Statut"],
  "Tüm Durumlar": ["All Statuses", "Tous les statuts"],
  "Sadece Açık Hatalar": ["Open Faults Only", "Défauts ouverts uniquement"],
  "Tüm İstasyonlar": ["All Stations", "Toutes les stations"],
  "İmalat Kalemi": ["Production Item", "Élément de production"],
  "Tüm Kalemler": ["All Items", "Tous les éléments"],
  "Kayıtlar yükleniyor…": ["Loading records…", "Chargement des enregistrements…"],
  "Bu filtrelere uyan hata kaydı yok.": ["No fault records match these filters.", "Aucun défaut ne correspond à ces filtres."],
  "Tarih": ["Date", "Date"],
  "Lokasyon": ["Location", "Emplacement"],
  "Hata Açıklaması": ["Fault Description", "Description du défaut"],
  "Koordinat / GPS": ["Coordinates / GPS", "Coordonnées / GPS"],
  "Sorumlu Ekip": ["Responsible Team", "Équipe responsable"],
  "{n} Hatası": ["{n} Fault", "Défaut : {n}"],
  "hata fotoğrafı": ["fault photo", "photo du défaut"],
  "Fotoğraf eklenmemiş": ["No photo attached", "Aucune photo jointe"],
  "Kapat": ["Close", "Fermer"],
  "Enlem": ["Latitude", "Latitude"],
  "Boylam": ["Longitude", "Longitude"],
  "Hata Raporu": ["Fault Report", "Rapport des défauts"],
  "İst.": ["St.", "St."],
  // Fault dialog
  "Hata Detayı": ["Fault Detail", "Détail du défaut"],
  "Kamera ve Medya": ["Camera and Media", "Caméra et médias"],
  "Kamera": ["Camera", "Caméra"],
  "Galeri": ["Gallery", "Galerie"],
  "Kameradan fotoğraf": ["Photo from camera", "Photo depuis la caméra"],
  "Galeriden fotoğraf": ["Photo from gallery", "Photo depuis la galerie"],
  "Fotoğraf hazırlanıyor…": ["Preparing photo…", "Préparation de la photo…"],
  "Hata fotoğrafı": ["Fault photo", "Photo du défaut"],
  "Fotoğrafı kaldır": ["Remove photo", "Supprimer la photo"],
  "Fotoğraf açılamadı.": ["Photo could not be opened.", "Impossible d'ouvrir la photo."],
  "Konum Bilgisi": ["Location Info", "Localisation"],
  "Konum alınıyor…": ["Getting location…", "Localisation en cours…"],
  "Mevcut Konumu Al": ["Get Current Location", "Obtenir la position actuelle"],
  "Bu cihaz konum hizmetini desteklemiyor.": ["This device does not support location services.", "Cet appareil ne prend pas en charge la localisation."],
  "Konum izni verilmedi. Cihaz ayarlarından izin verebilir veya X, Y, Z bilgilerini girebilirsiniz.": ["Location permission denied. Allow it in device settings or enter X, Y, Z manually.", "Autorisation refusée. Autorisez-la dans les réglages ou saisissez X, Y, Z."],
  "Konum alma süresi doldu. Tekrar deneyin veya koordinatları girin.": ["Location request timed out. Try again or enter coordinates.", "Délai dépassé. Réessayez ou saisissez les coordonnées."],
  "Konum bulunamadı. Konum hizmetini kontrol edin veya koordinatları girin.": ["Location not found. Check location services or enter coordinates.", "Position introuvable. Vérifiez la localisation ou saisissez les coordonnées."],
  "Haritacı Koordinat Girişi": ["Surveyor Coordinate Entry", "Saisie des coordonnées (géomètre)"],
  "Hata giderildi": ["Fault resolved", "Défaut résolu"],
  "Kritik hata": ["Critical fault", "Défaut critique"],
  "Ekip seçin": ["Select team", "Choisir une équipe"],
  "Önce ekip ekleyin": ["Add a team first", "Ajoutez d'abord une équipe"],
  " (silinmiş)": [" (deleted)", " (supprimée)"],
  "Ekipleri Yönet": ["Manage Teams", "Gérer les équipes"],
  "Kaydet": ["Save", "Enregistrer"],
  // Teams
  "Sorumlu ekipler": ["Responsible teams", "Équipes responsables"],
  "Yeni ekip adı": ["New team name", "Nom de la nouvelle équipe"],
  "Ekle": ["Add", "Ajouter"],
  "Henüz ekip yok.": ["No teams yet.", "Aucune équipe pour le moment."],
  "Vazgeç": ["Cancel", "Annuler"],
  "Düzenle": ["Edit", "Modifier"],
  "Sil": ["Delete", "Supprimer"],
  "yeni adı": ["new name", "nouveau nom"],
  "Ekip listesi cihazda saklanamadı.": ["Team list could not be saved on this device.", "Liste des équipes non enregistrée sur cet appareil."],
  "Ekip adı boş olamaz.": ["Team name cannot be empty.", "Le nom de l'équipe ne peut pas être vide."],
  "Bu isimde bir ekip zaten var.": ["A team with this name already exists.", "Une équipe porte déjà ce nom."],
  // Settings
"© 2026 | Designed By OUZ51 | Tüm hakları saklıdır.": ["© 2026 | Designed By OUZ51 | All rights reserved.", "© 2026 | Designed By OUZ51 | Tous droits réservés."],
  // Günün Sözü
  "Bugün atılan her adım, yarının gücünü hazırlar.": ["Every step taken today prepares tomorrow's strength.", "Chaque pas fait aujourd'hui prépare la force de demain."],
  "Emek, sabırla birleşince kalite olur.": ["Effort, combined with patience, becomes quality.", "L'effort, uni à la patience, devient qualité."],
  "İyi iş, iyi insanın izidir.": ["Good work is the mark of good people.", "Le bon travail est la trace des bonnes personnes."],
  "Azim, taşın yolunu açar.": ["Perseverance paves the way through stone.", "La persévérance ouvre la voie à travers la pierre."],
  "Her doğru montaj, ekibin övünmesidir.": ["Every correct assembly is the team's pride.", "Chaque montage correct est la fierté de l'équipe."],
  "Güneş her gün doğar; biz de her gün daha iyisini kurarız.": ["The sun rises every day; we build something better every day.", "Le soleil se lève chaque jour ; nous construisons chaque jour mieux."],
  "Başarı, tekrar edilen özenin sonucudur.": ["Success is the result of care repeated.", "Le succès est le fruit du soin répété."],
  "Kalite tesadüf değil, alışkanlıktır.": ["Quality is not a coincidence, it is a habit.", "La qualité n'est pas un hasard, c'est une habitude."],
  "Genel Ayarlar": ["General Settings", "Paramètres généraux"],
  "Proje Adı": ["Project Name", "Nom du projet"],
  "Proje Detayı": ["Project Detail", "Détail du projet"],
  "Ayarlar kaydedildi": ["Settings saved", "Paramètres enregistrés"],
  "Görünüm Ayarları": ["Appearance Settings", "Paramètres d'affichage"],
  "Menü yapısı": ["Menu layout", "Disposition du menu"],
  "Sol Yan Menü": ["Left Sidebar", "Menu latéral gauche"],
  "Alt Menü": ["Bottom Menu", "Menu inférieur"],
"Dil Seçimi": ["Language", "Langue"],
  // Revision edit/delete
  "Bu kayıt kalıcı olarak silinecek.": ["This record will be permanently deleted.", "Cet enregistrement sera supprimé définitivement."],
  "Evet, Sil": ["Yes, Delete", "Oui, supprimer"],
  "Kayıt silindi": ["Record deleted", "Enregistrement supprimé"],
  "Kayıt silinemedi": ["Record could not be deleted", "Impossible de supprimer l'enregistrement"],
  "Değişiklikler kaydedildi": ["Changes saved", "Modifications enregistrées"],
  "Değişiklikler kaydedilemedi": ["Changes could not be saved", "Impossible d'enregistrer les modifications"],
  "Hata kaydı cihazdan silinemedi. Depolama izinlerini kontrol edin.": ["The fault record could not be deleted from this device. Check storage permissions.", "Le défaut n'a pas pu être supprimé de cet appareil. Vérifiez les autorisations de stockage."],
};

export function translate(lang: Language, text: string, vars?: Record<string, string | number>) {
  const entry = DICT[text];
  let out = lang === "tr" || !entry ? text : entry[lang === "en" ? 0 : 1];
  if (vars) for (const [k, v] of Object.entries(vars)) out = out.replace(`{${k}}`, String(v));
  return out;
}

interface LanguageState { lang: Language; locale: string; setLang: (l: Language) => void; t: (text: string, vars?: Record<string, string | number>) => string }
const LanguageContext = createContext<LanguageState | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>("tr");
  useEffect(() => {
    try { setLangState(parseLanguage(localStorage.getItem(LANGUAGE_STORAGE_KEY))); } catch { /* storage unavailable */ }
  }, []);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  function setLang(next: Language) {
    setLangState(next);
    try { localStorage.setItem(LANGUAGE_STORAGE_KEY, next); } catch { /* storage unavailable */ }
  }
  const value: LanguageState = { lang, locale: LOCALES[lang], setLang, t: (text, vars) => translate(lang, text, vars) };
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) return { lang: "tr" as Language, locale: "tr-TR", setLang: () => {}, t: (text: string, vars?: Record<string, string | number>) => translate("tr", text, vars) };
  return ctx;
}
