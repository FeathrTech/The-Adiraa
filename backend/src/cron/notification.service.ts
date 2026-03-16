import { Injectable, Logger } from '@nestjs/common';
import Expo from 'expo-server-sdk';
import { ExpoPushMessage } from 'expo-server-sdk';


@Injectable()
export class NotificationService {

    private readonly logger = new Logger(NotificationService.name);
    private readonly expo = new Expo();

    async sendPushNotification(
        tokens: string[],
        title: string,
        body: string,
        data?: Record<string, any>,
    ): Promise<void> {

        const messages: ExpoPushMessage[] = [];

        for (const token of tokens) {
            if (!Expo.isExpoPushToken(token)) {
                this.logger.warn(`Invalid Expo push token: ${token}`);
                continue;
            }

            messages.push({
                to: token,
                sound: 'default',
                title,
                body,
                data: data ?? {},
            });
        }

        if (messages.length === 0) return;

        const chunks = this.expo.chunkPushNotifications(messages);

        for (const chunk of chunks) {
            try {
                const receipts = await this.expo.sendPushNotificationsAsync(chunk);
                this.logger.debug(`Sent ${receipts.length} notifications`);
            } catch (error) {
                this.logger.error('Push notification error', error);
            }
        }
    }
}