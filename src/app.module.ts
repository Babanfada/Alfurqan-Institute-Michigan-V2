import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BannersModule } from './banners/banners.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { EventsModule } from './events/events.module';
import { ProgrammesModule } from './programmes/programmes.module';
import { UsersModule } from './users/users.module';
import { QuranModule } from './quran/quran.module';
import { FeedbacksModule } from './feedbacks/feedbacks.module';
import { DonationsModule } from './donations/donations.module';
import { RegisterationsModule } from './registerations/registerations.module';
import { EnquiriesModule } from './enquiries/enquiries.module';
import { ProductsModule } from './products/products.module';
import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './mail/mail.module';
import { CommonModule } from './common/common.module';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';


@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        `.env.${process.env.NODE_ENV}`, // loads .env.development or .env.production
        '.env', // fallback
      ],
    }),
    AuthModule,
    BannersModule,
    CampaignsModule,
    EventsModule,
    ProgrammesModule,
    UsersModule,
    QuranModule,
    FeedbacksModule,
    DonationsModule,
    RegisterationsModule,
    EnquiriesModule,
    ProductsModule,
    PrismaModule,
    MailModule,
    CommonModule,
    AdminModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
