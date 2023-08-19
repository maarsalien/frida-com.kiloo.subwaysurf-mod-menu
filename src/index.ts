import 'frida-il2cpp-bridge';
import { getActivity, sleep, ensureModuleInitialized, JavaIl2cppPerform } from './util.js';

type Il2CppThis = Il2Cpp.Class | Il2Cpp.Object;

const APP_MAIN_ACTIVITY = 'com.sybogames.chili.multidex.ChiliMultidexSupportActivity';

const modules = ['libil2cpp.so', 'libunity.so', 'libmain.so'];

JavaIl2cppPerform(async () => {
  await sleep(1000);
  await ensureModuleInitialized(...modules);

  const mainActivity = await getActivity(APP_MAIN_ACTIVITY);
  if (!mainActivity) throw new Error('Failed to get main activity');

  main(mainActivity).catch((error) => console.error(error));
});

async function main(mainActivity: Java.Wrapper) {
  // Getting Java classes

  const Menu = Java.use('com.maars.fmenu.Menu');
  const Config = Java.use('com.maars.fmenu.Config');
  const Bool = Java.use('com.maars.fmenu.PBoolean');
  const Int = Java.use('com.maars.fmenu.PInteger');

  // Getting unity classes

  const AssemblyCSharp = Il2Cpp.domain.assembly('Assembly-CSharp');

  const CharacterMotor = AssemblyCSharp.image.class('SYBO.RunnerCore.Character.CharacterMotor');
  const ScoreMultiplierManager = AssemblyCSharp.image.class('SYBO.Subway.ScoreMultiplierManager');
  const UpgradesModel = AssemblyCSharp.image.class('SYBO.Subway.Meta.UpgradesModel');
  const Achievement = AssemblyCSharp.image.class('SYBO.Subway.Meta.Achievement');
  const WalletModel = AssemblyCSharp.image.class('SYBO.Subway.Meta.WalletModel');
  const Currency = AssemblyCSharp.image.class('SYBO.Subway.Meta.Currency');

  // Creating state variables

  const isNoColision = Bool.of(false);
  const scoreMultiplier = Int.of(0);
  const powerUpLevel = Int.of(0);
  const isUnlockAllAchievements = Bool.of(false);
  const currency = Int.of(0);
  const isFreeIAP = Bool.of(false);

  // Creating a custom config

  const config = Config.$new();

  config.MENU_TITLE.value = 'Subway Surfers (by maars)';
  config.MENU_SUBTITLE.value = 'Have fun! learn more at https://github.com/maarsalien/frida-android-mod-menu';

  const menu = Menu.$new(mainActivity, config);

  // Building menu
  menu.Switch('No Colision', isNoColision);
  menu.Switch('Free IAP', isFreeIAP);
  menu.Switch('Unlock All Achievements', isUnlockAllAchievements);
  menu.SeekBar('Power Up Level', powerUpLevel, 0, 6);
  menu.InputNum('Score Multiplier', scoreMultiplier);
  menu.InputNum('Currency', currency);

  // Hooking methods

  CharacterMotor.method('CheckFrontalImpact').implementation = function (this: Il2CppThis, impactState: Il2Cpp.Object) {
    if (isNoColision.get()) return false;
    return this.method('CheckFrontalImpact').invoke(impactState);
  };

  CharacterMotor.method('CheckSideImpact').implementation = function (this: Il2CppThis, impactState: Il2Cpp.Object) {
    if (isNoColision.get()) return false;
    return this.method('CheckSideImpact').invoke(impactState);
  };

  ScoreMultiplierManager.method('get_BaseMultiplierSum').implementation = function () {
    if (scoreMultiplier.get() > 0) return scoreMultiplier.get();
    return this.method('get_BaseMultiplierSum').invoke();
  };

  UpgradesModel.method('GetPowerupLevel').implementation = function (this: Il2CppThis, powerupId: Il2Cpp.String) {
    if (powerUpLevel.get() > 0) return powerUpLevel.get();
    return this.method('GetPowerupLevel').invoke(powerupId);
  };

  Achievement.method('get_IsTierCompleted').implementation = function () {
    if (isUnlockAllAchievements.get()) return true;
    return this.method('get_IsTierCompleted').invoke();
  };

  WalletModel.method('GetCurrency').implementation = function (this: Il2CppThis, type: number) {
    if (currency.get() > 0) return currency.get();
    return this.method('GetCurrency').invoke(type);
  };

  Currency.method('get_IsIAP').implementation = function () {
    if (isFreeIAP.get()) return false;
    return this.method('get_IsIAP').invoke();
  };

  Java.scheduleOnMainThread(() => {
    menu.attach();
  });
}
