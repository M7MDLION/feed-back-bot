import { Client, GatewayIntentBits, Partials, AttachmentBuilder, Events } from "discord.js";
import Canvas from "canvas";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel],
});

const TOKEN = "توكن_البوت";
const FEEDBACK_CHANNEL_ID = "ايدي_روم_الفيدباك";

client.on("error", console.error);
process.on("unhandledRejection", console.error);

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line, x, y);
      line = words[n] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, y);
}

client.on(Events.MessageCreate, async (message) => {
  try {
    if (message.author.bot) return;
    if (message.channel.id !== FEEDBACK_CHANNEL_ID) return;

    const admin = message.mentions.users.first();
    if (!admin) return message.reply("⚠️ لازم تعمل منشن للإداري.");

    const feedback = message.content.replace(`<@${admin.id}>`, "").trim();
    if (!feedback) return message.reply("⚠️ اكتب الفيدباك بعد المنشن.");

    // ⚡ تحميل صورة المستخدم
    let avatar = null;
    try {
      avatar = await Canvas.loadImage(
        message.author.displayAvatarURL({ extension: "png", size: 256 })
      );
    } catch {
      avatar = null;
    }

    // Canvas setup
    const canvas = Canvas.createCanvas(900, 450);
    const ctx = canvas.getContext("2d");

    // 1️⃣ خلفية Neon مع gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, "#0f0c29");
    gradient.addColorStop(0.5, "#302b63");
    gradient.addColorStop(1, "#24243e");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 2️⃣ تأثير بطاقة الفيدباك
    ctx.fillStyle = "#1c1c1c";
    ctx.shadowColor = "#00ffff77";
    ctx.shadowBlur = 25;
    ctx.fillRect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.shadowBlur = 0;

    // 3️⃣ صورة المستخدم دائرية مع Glow
    if (avatar) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(150, 200, 80, 0, Math.PI * 2, true);
      ctx.closePath();
      ctx.clip();
      ctx.shadowColor = "#00ffff55";
      ctx.shadowBlur = 20;
      ctx.drawImage(avatar, 70, 120, 160, 160);
      ctx.restore();
    }

    // 4️⃣ اسم المستخدم بخط كبير وGlow
    ctx.font = "bold 40px Arial";
    ctx.fillStyle = "#00ffff";
    ctx.shadowColor = "#00ffff88";
    ctx.shadowBlur = 15;
    ctx.fillText(message.author.username, 270, 180);
    ctx.shadowBlur = 0;

    // 5️⃣ نص الفيدباك - حجم أكبر
    ctx.font = "36px Arial"; // من 28px لـ 36px
    ctx.fillStyle = "#cfcfcf";
    wrapText(ctx, feedback, 270, 220, canvas.width - 320, 48); // lineHeight أكبر

    // 6️⃣ Neon خطوط صغيرة زخرفية (حواف البطاقة)
    ctx.strokeStyle = "#00ffff44";
    ctx.lineWidth = 3;
    ctx.shadowColor = "#00ffff66";
    ctx.shadowBlur = 15;
    ctx.strokeRect(50, 50, canvas.width - 100, canvas.height - 100);
    ctx.shadowBlur = 0;

    // إرسال الصورة
    const attachment = new AttachmentBuilder(canvas.toBuffer(), { name: "feedback.png" });
    const sentMessage = await message.channel.send({
      content: `Feedback from ${message.author} to ${admin} ✨`,
      files: [attachment],
    });

    // إضافة رياكشنز تلقائي
    await sentMessage.react("<:511:1390466463550148758>");
    await sentMessage.react("❤️");
    await sentMessage.react("<:pngclipartthumbsignalemojiemojih:1410295354863124480>");

    // حذف الرسالة الأصلية لو البوت عنده صلاحية
    if (message.guild?.members.me.permissions.has("ManageMessages")) {
      await message.delete().catch(() => {});
    }

  } catch (err) {
    console.error("Error handling feedback message:", err);
    message.reply("❌ حصل خطأ أثناء معالجة الفيدباك، جرب تاني.");
  }
});

client.login(TOKEN);
