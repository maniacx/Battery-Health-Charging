'use strict';
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const {
    Asus, Lg, Samsung, Sony, Huawei, Toshiba, System76, Lenovo, ThinkpadLegacy, Apple, Librem,
    Acer, Msi, Thinkpad, Dell, Panasonic, QC71, Asahi, Tuxedo, Gigabyte, Razer, Framework,
} = Me.imports.devices;

var deviceArray = [
    Asus.AsusSingleBatteryBAT0,                     // 1
    Asus.AsusSingleBatteryBAT1,                     // 2
    Asus.AsusSingleBatteryBATC,                     // 3
    Asus.AsusSingleBatteryBATT,                     // 4
    Lg.LgSingleBattery,                             // 5
    Samsung.SamsungSingleBattery,                   // 6
    Sony.SonySingleBattery,                         // 7
    Huawei.HuaweiSingleBattery,                     // 8
    Toshiba.ToshibaSingleBatteryBAT0,               // 9
    Toshiba.ToshibaSingleBatteryBAT1,               // 10
    System76.System76SingleBattery,                 // 11
    Lenovo.LenovoSingleBattery,                     // 12
    ThinkpadLegacy.ThinkpadLegacyDualBattery,       // 13
    ThinkpadLegacy.ThinkpadLegacySingleBatteryBAT0, // 14
    ThinkpadLegacy.ThinkpadLegacySingleBatteryBAT1, // 15
    Apple.AppleSingleBattery,                       // 16
    Acer.AcerSingleBattery,                         // 17
    Msi.MsiSingleBatteryBAT0,                       // 18
    Thinkpad.ThinkpadDualBattery,                   // 19
    Thinkpad.ThinkpadSingleBatteryBAT0,             // 20
    Thinkpad.ThinkpadSingleBatteryBAT1,             // 21
    Dell.DellSmBiosSingleBattery,                   // 22
    Panasonic.PanasonicSingleBattery,               // 23
    QC71.QC71SingleBatteryBAT0,                     // 24
    Asahi.AsahiSingleBattery62,                     // 25
    Msi.MsiSingleBatteryBAT1,                       // 26
    Tuxedo.Tuxedo3ModesSingleBattery,               // 27
    Gigabyte.GigabyteSingleBattery,                 // 28
    Asahi.AsahiSingleBattery63,                     // 29
    Razer.RazerSingleBattery,                       // 30
    Framework.FrameworkSingleBatteryBAT1,           // 31
    Librem.LibremSingleBatteryBAT0,                 // 32
];
