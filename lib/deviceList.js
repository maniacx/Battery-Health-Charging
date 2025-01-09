'use strict';
import * as Acer from '../devices/Acer.js';
import * as Apple from '../devices/Apple.js';
import * as Asahi from '../devices/Asahi.js';
import * as Asus from '../devices/Asus.js';
import * as Dell from '../devices/Dell.js';
import * as Gigabyte from '../devices/Gigabyte.js';
import * as Huawei from '../devices/Huawei.js';
import * as Lenovo from '../devices/Lenovo.js';
import * as Lg from '../devices/Lg.js';
import * as Msi from '../devices/Msi.js';
import * as Panasonic from '../devices/Panasonic.js';
import * as Razer from '../devices/Razer.js';
import * as QC71 from '../devices/QC71.js';
import * as Samsung from '../devices/Samsung.js';
import * as Sony from '../devices/Sony.js';
import * as System76 from '../devices/System76.js';
import * as Thinkpad from '../devices/Thinkpad.js';
import * as ThinkpadLegacy from '../devices/ThinkpadLegacy.js';
import * as Toshiba from '../devices/Toshiba.js';
import * as Tuxedo from '../devices/Tuxedo.js';
import * as Framework from '../devices/Framework.js';
import * as Librem from '../devices/Librem.js';
import * as Fujitsu from '../devices/Fujitsu.js';
import * as Chromebook from '../devices/Chromebook.js';

export const deviceArray = [
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
    Fujitsu.FujitsuSingleBatteryCMB0,               // 33
    Fujitsu.FujitsuSingleBatteryCMB1,               // 34
    Chromebook.ChromebookSingleBattery,             // 35
    Framework.FrameworkSingleBatteryEndStartBAT1,   // 36
    Chromebook.ChromebookSingleBatteryV2,           // 37
];
