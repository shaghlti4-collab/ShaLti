export const WILAYAS = [
  ['hodh-chargui', 'الحوض الشرقي', 'Hodh Ech Chargui'],
  ['hodh-gharbi', 'الحوض الغربي', 'Hodh El Gharbi'],
  ['assaba', 'لعصابه', 'Assaba'],
  ['gorgol', 'كوركل', 'Gorgol'],
  ['brakna', 'لبراكنه', 'Brakna'],
  ['trarza', 'الترارزه', 'Trarza'],
  ['adrar', 'آدرار', 'Adrar'],
  ['dakhlet-nouadhibou', 'داخلت نواذيبو', 'Dakhlet Nouadhibou'],
  ['tagant', 'تكانت', 'Tagant'],
  ['guidimaka', 'كيدي ماغه', 'Guidimagha'],
  ['tiris-zemmour', 'تيرس زمور', 'Tiris Zemmour'],
  ['inchiri', 'إنشيري', 'Inchiri'],
  ['nouakchott-nord', 'نواكشوط الشمالية', 'Nouakchott-Nord'],
  ['nouakchott-ouest', 'نواكشوط الغربية', 'Nouakchott-Ouest'],
  ['nouakchott-sud', 'نواكشوط الجنوبية', 'Nouakchott-Sud']
].map(([id, ar, fr]) => ({ id, ar, fr }));

export const DAYS = [
  ['sat', 'السبت', 'Samedi'], ['sun', 'الأحد', 'Dimanche'], ['mon', 'الاثنين', 'Lundi'],
  ['tue', 'الثلاثاء', 'Mardi'], ['wed', 'الأربعاء', 'Mercredi'], ['thu', 'الخميس', 'Jeudi'], ['fri', 'الجمعة', 'Vendredi']
].map(([id, ar, fr]) => ({ id, ar, fr }));

const dict = {
  ar: {
    'brand': 'شغلتي',
    'common.theme': 'تبديل المظهر', 'common.cancel': 'إلغاء', 'common.close': 'إغلاق', 'common.loading': 'جارٍ التحميل…',
    'nav.home': 'الرئيسية', 'nav.jobs': 'الوظائف', 'nav.add': 'إضافة', 'nav.account': 'حسابي', 'nav.login': 'دخول',
    'home.title': 'اعثر على وظيفتك أو موظفك القادم في موريتانيا',
    'home.sub': 'تصفّح إعلانات الوظائف وتواصل مباشرة مع صاحب الإعلان عبر واتساب، أو انشر إعلانك في دقائق.',
    'home.browse': 'تصفّح الوظائف', 'home.add': 'أضف وظيفة', 'home.latest': 'أحدث الوظائف', 'home.seeAll': 'عرض الكل',
    'home.count': '{n} وظيفة منشورة', 'home.countNone': 'لا توجد وظائف منشورة بعد',
    'jobs.title': 'الوظائف', 'jobs.add': 'أضف وظيفة', 'jobs.search': 'ابحث عن وظيفة…', 'jobs.allWilayas': 'كل الولايات',
    'jobs.count': '{n} وظيفة موجودة', 'jobs.emptyTitle': 'لا توجد وظائف تطابق البحث', 'jobs.emptySub': 'جرّب اسم وظيفة أو ولاية أخرى.',
    'jobs.noneTitle': 'لم يُنشر أي إعلان بعد', 'jobs.noneSub': 'كن أول من ينشر وظيفة على المنصة.',
    'jobs.loadError': 'تعذّر تحميل الوظائف', 'jobs.loadErrorSub': 'تحقق من اتصالك بالإنترنت ثم أعد المحاولة.', 'jobs.retry': 'إعادة المحاولة',
    'job.period.morning': 'صباحية', 'job.period.evening': 'مسائية', 'job.period.both': 'صباحية ومسائية',
    'job.daily': 'يومياً', 'job.salary': 'الراتب الشهري', 'job.currency': 'أوقية (قديمة)', 'job.posted': 'تاريخ النشر',
    'job.contact': 'تواصل عبر واتساب', 'job.details': 'تفاصيل الوظيفة', 'job.workDays': 'أيام العمل', 'job.workPeriod': 'فترة العمل',
    'job.wilaya': 'الولاية', 'job.delete': 'حذف الإعلان', 'job.deleteTitle': 'حذف هذا الإعلان؟',
    'job.deleteText': 'سيُحذف الإعلان نهائياً ولا يمكن التراجع عن ذلك.', 'job.deleted': 'تم حذف الإعلان', 'job.waText': 'السلام عليكم، بخصوص إعلان وظيفة «{title}» على شغلتي',
    'add.title': 'أضف وظيفة', 'add.titleLabel': 'اسم الوظيفة', 'add.titlePh': 'مثال: سائق، صيدلي، محاسب',
    'add.desc': 'تفاصيل الوظيفة', 'add.descPh': 'اكتب مهام العمل والشروط والمتطلبات…',
    'add.period': 'فترة العمل', 'add.days': 'أيام العمل', 'add.daysDaily': 'العمل يومياً', 'add.daysCustom': 'تحديد أيام معينة',
    'add.salary': 'الراتب الشهري', 'add.wilaya': 'الولاية', 'add.wilayaPh': 'اختر الولاية',
    'add.phone': 'رقم التواصل (واتساب)', 'add.phoneHint': 'أدخل رقمك الموريتاني المكوّن من 8 أرقام دون مفتاح الدولة.',
    'add.publish': 'نشر الوظيفة', 'add.success': 'تم نشر الوظيفة بنجاح',
    'val.title': 'اكتب اسم الوظيفة (حرفان على الأقل).', 'val.desc': 'اكتب تفاصيل الوظيفة (20 حرفاً على الأقل).',
    'val.period': 'اختر فترة العمل.', 'val.days': 'اختر يوماً واحداً على الأقل.', 'val.salary': 'أدخل راتباً شهرياً صحيحاً.',
    'val.wilaya': 'اختر الولاية.', 'val.phone': 'أدخل رقماً موريتانياً صحيحاً من 8 أرقام يبدأ بـ 2 أو 3 أو 4.',
    'val.name': 'أدخل اسمك.', 'val.email': 'أدخل بريداً إلكترونياً صحيحاً.', 'val.pass': 'كلمة المرور 8 أحرف على الأقل وتحتوي على حرف ورقم.',
    'val.pass2': 'كلمتا المرور غير متطابقتين.', 'val.passReq': 'أدخل كلمة المرور.',
    'verify.title': 'أكّد بريدك الإلكتروني لتتمكن من النشر', 'verify.text': 'أرسلنا رابط التحقق إلى {email}. افتح الرابط ثم عد إلى هنا. تفقّد مجلد الرسائل غير المرغوبة إن لم تجده.',
    'verify.resend': 'إعادة إرسال الرابط', 'verify.done': 'لقد أكدت بريدي', 'verify.sent': 'تم إرسال رابط التحقق إلى بريدك',
    'verify.notYet': 'لم يتم تأكيد البريد بعد. افتح الرابط في الرسالة أولاً.', 'verify.ok': 'تم تأكيد بريدك. يمكنك الآن نشر الوظائف.',
    'verify.wait': 'انتظر قليلاً قبل إعادة الإرسال.',
    'auth.login': 'تسجيل الدخول', 'auth.register': 'إنشاء حساب', 'auth.name': 'الاسم', 'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور', 'auth.passHint': '8 أحرف على الأقل، تحتوي على حرف ورقم.', 'auth.confirm': 'تأكيد كلمة المرور',
    'auth.google': 'المتابعة باستخدام Google', 'auth.or': 'أو', 'auth.forgot': 'نسيت كلمة المرور؟',
    'auth.resetTitle': 'استعادة كلمة المرور', 'auth.resetText': 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً آمناً لإعادة تعيين كلمة المرور.',
    'auth.resetSend': 'إرسال الرابط', 'auth.resetSent': 'تم إرسال تعليمات الاستعادة إلى بريدك الإلكتروني.',
    'auth.loginFirst': 'سجّل الدخول أولاً لتتمكن من نشر وظيفة.', 'auth.created': 'تم إنشاء حسابك وأرسلنا رابط التحقق إلى بريدك.',
    'auth.welcome': 'أهلاً بك', 'auth.logout': 'تسجيل الخروج', 'auth.loggedOut': 'تم تسجيل الخروج',
    'account.title': 'حسابي', 'account.myJobs': 'إعلاناتي', 'account.noJobs': 'لم تنشر أي وظيفة بعد', 'account.noJobsSub': 'أعلاناتك المنشورة ستظهر هنا.',
    'account.verified': 'بريد مؤكد', 'account.unverified': 'بريد غير مؤكد',
    'e.invalid': 'البريد أو كلمة المرور غير صحيحة.', 'e.exists': 'هذا البريد مسجّل مسبقاً. جرّب تسجيل الدخول.',
    'e.weak': 'كلمة المرور ضعيفة.', 'e.network': 'تعذّر الاتصال. تحقق من الإنترنت.', 'e.many': 'محاولات كثيرة. انتظر قليلاً ثم أعد المحاولة.',
    'e.popup': 'أُغلقت نافذة Google قبل إتمام الدخول.', 'e.domain': 'نطاق الموقع غير مضاف في إعدادات Firebase Authentication.',
    'e.permission': 'لا تملك صلاحية تنفيذ هذه العملية. تأكد من تأكيد بريدك.', 'e.generic': 'حدث خطأ غير متوقع. أعد المحاولة.',
    'e.disabled': 'هذا الحساب معطّل.',
    'e.inapp': 'تعذّر الدخول بـ Google في هذا المتصفح. افتح الموقع في Chrome أو Safari (وليس داخل واتساب) أو سجّل بالبريد.'
  },
  fr: {
    'brand': 'Shaghlti',
    'common.theme': 'Changer le thème', 'common.cancel': 'Annuler', 'common.close': 'Fermer', 'common.loading': 'Chargement…',
    'nav.home': 'Accueil', 'nav.jobs': 'Emplois', 'nav.add': 'Publier', 'nav.account': 'Compte', 'nav.login': 'Connexion',
    'home.title': 'Trouvez votre prochain emploi ou employé en Mauritanie',
    'home.sub': 'Parcourez les offres et contactez directement l’annonceur sur WhatsApp, ou publiez la vôtre en quelques minutes.',
    'home.browse': 'Voir les offres', 'home.add': 'Ajouter une offre', 'home.latest': 'Dernières offres', 'home.seeAll': 'Tout voir',
    'home.count': '{n} offres publiées', 'home.countNone': 'Aucune offre publiée pour l’instant',
    'jobs.title': 'Offres d’emploi', 'jobs.add': 'Ajouter une offre', 'jobs.search': 'Rechercher un poste…', 'jobs.allWilayas': 'Toutes les wilayas',
    'jobs.count': '{n} offres trouvées', 'jobs.emptyTitle': 'Aucune offre ne correspond', 'jobs.emptySub': 'Essayez un autre poste ou une autre wilaya.',
    'jobs.noneTitle': 'Aucune offre publiée', 'jobs.noneSub': 'Soyez le premier à publier une offre.',
    'jobs.loadError': 'Impossible de charger les offres', 'jobs.loadErrorSub': 'Vérifiez votre connexion puis réessayez.', 'jobs.retry': 'Réessayer',
    'job.period.morning': 'Matin', 'job.period.evening': 'Soir', 'job.period.both': 'Matin et soir',
    'job.daily': 'Tous les jours', 'job.salary': 'Salaire mensuel', 'job.currency': 'UM (anciennes)', 'job.posted': 'Date de publication',
    'job.contact': 'Contacter sur WhatsApp', 'job.details': 'Détails du poste', 'job.workDays': 'Jours de travail', 'job.workPeriod': 'Période de travail',
    'job.wilaya': 'Wilaya', 'job.delete': 'Supprimer l’offre', 'job.deleteTitle': 'Supprimer cette offre ?',
    'job.deleteText': 'L’offre sera supprimée définitivement. Cette action est irréversible.', 'job.deleted': 'Offre supprimée', 'job.waText': 'Bonjour, au sujet de l’offre « {title} » sur Shaghlti',
    'add.title': 'Ajouter une offre', 'add.titleLabel': 'Intitulé du poste', 'add.titlePh': 'Ex. : chauffeur, pharmacien, comptable',
    'add.desc': 'Détails du poste', 'add.descPh': 'Missions, conditions et exigences…',
    'add.period': 'Période de travail', 'add.days': 'Jours de travail', 'add.daysDaily': 'Tous les jours', 'add.daysCustom': 'Jours précis',
    'add.salary': 'Salaire mensuel', 'add.wilaya': 'Wilaya', 'add.wilayaPh': 'Choisir la wilaya',
    'add.phone': 'Numéro de contact (WhatsApp)', 'add.phoneHint': 'Saisissez votre numéro mauritanien à 8 chiffres, sans indicatif.',
    'add.publish': 'Publier l’offre', 'add.success': 'Offre publiée avec succès',
    'val.title': 'Saisissez l’intitulé du poste (2 caractères minimum).', 'val.desc': 'Saisissez les détails (20 caractères minimum).',
    'val.period': 'Choisissez la période de travail.', 'val.days': 'Choisissez au moins un jour.', 'val.salary': 'Saisissez un salaire mensuel valide.',
    'val.wilaya': 'Choisissez la wilaya.', 'val.phone': 'Saisissez un numéro mauritanien valide à 8 chiffres commençant par 2, 3 ou 4.',
    'val.name': 'Saisissez votre nom.', 'val.email': 'Saisissez une adresse e-mail valide.', 'val.pass': 'Mot de passe : 8 caractères minimum avec une lettre et un chiffre.',
    'val.pass2': 'Les mots de passe ne correspondent pas.', 'val.passReq': 'Saisissez le mot de passe.',
    'verify.title': 'Confirmez votre e-mail pour pouvoir publier', 'verify.text': 'Nous avons envoyé un lien de vérification à {email}. Ouvrez-le puis revenez ici. Pensez à vérifier les courriers indésirables.',
    'verify.resend': 'Renvoyer le lien', 'verify.done': 'J’ai confirmé mon e-mail', 'verify.sent': 'Lien de vérification envoyé',
    'verify.notYet': 'E-mail pas encore confirmé. Ouvrez d’abord le lien reçu.', 'verify.ok': 'E-mail confirmé. Vous pouvez publier des offres.',
    'verify.wait': 'Patientez un instant avant de renvoyer.',
    'auth.login': 'Se connecter', 'auth.register': 'Créer un compte', 'auth.name': 'Nom', 'auth.email': 'Adresse e-mail',
    'auth.password': 'Mot de passe', 'auth.passHint': '8 caractères minimum, avec une lettre et un chiffre.', 'auth.confirm': 'Confirmer le mot de passe',
    'auth.google': 'Continuer avec Google', 'auth.or': 'ou', 'auth.forgot': 'Mot de passe oublié ?',
    'auth.resetTitle': 'Réinitialiser le mot de passe', 'auth.resetText': 'Saisissez votre e-mail, nous vous enverrons un lien sécurisé de réinitialisation.',
    'auth.resetSend': 'Envoyer le lien', 'auth.resetSent': 'Les instructions ont été envoyées à votre adresse e-mail.',
    'auth.loginFirst': 'Connectez-vous d’abord pour publier une offre.', 'auth.created': 'Compte créé. Un lien de vérification a été envoyé à votre e-mail.',
    'auth.welcome': 'Bienvenue', 'auth.logout': 'Se déconnecter', 'auth.loggedOut': 'Vous êtes déconnecté',
    'account.title': 'Mon compte', 'account.myJobs': 'Mes offres', 'account.noJobs': 'Vous n’avez publié aucune offre', 'account.noJobsSub': 'Vos offres publiées apparaîtront ici.',
    'account.verified': 'E-mail confirmé', 'account.unverified': 'E-mail non confirmé',
    'e.invalid': 'E-mail ou mot de passe incorrect.', 'e.exists': 'Cet e-mail est déjà utilisé. Essayez de vous connecter.',
    'e.weak': 'Mot de passe trop faible.', 'e.network': 'Connexion impossible. Vérifiez votre Internet.', 'e.many': 'Trop de tentatives. Patientez puis réessayez.',
    'e.popup': 'La fenêtre Google a été fermée avant la fin de la connexion.', 'e.domain': 'Le domaine du site n’est pas autorisé dans Firebase Authentication.',
    'e.permission': 'Action non autorisée. Vérifiez que votre e-mail est confirmé.', 'e.generic': 'Une erreur est survenue. Réessayez.',
    'e.disabled': 'Ce compte est désactivé.',
    'e.inapp': 'Connexion Google impossible dans ce navigateur. Ouvrez le site dans Chrome ou Safari (pas dans WhatsApp) ou utilisez l’e-mail.'
  }
};

let lang = 'ar';
try { lang = localStorage.getItem('sh-lang') || 'ar'; } catch (e) {}
if (!dict[lang]) lang = 'ar';

export const getLang = () => lang;
export function t(key, vars) {
  let s = dict[lang][key] ?? dict.ar[key] ?? key;
  if (vars) for (const k in vars) s = s.replaceAll(`{${k}}`, vars[k]);
  return s;
}
export const wName = id => { const w = WILAYAS.find(x => x.id === id); return w ? w[lang] : id; };
export const dName = id => { const d = DAYS.find(x => x.id === id); return d ? d[lang] : id; };

export function setLang(l) {
  lang = l;
  try { localStorage.setItem('sh-lang', l); } catch (e) {}
  const d = document.documentElement;
  d.lang = l; d.dir = l === 'ar' ? 'rtl' : 'ltr';
}
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => { el.placeholder = t(el.dataset.i18nPh); });
  root.querySelectorAll('[data-i18n-aria]').forEach(el => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
}
