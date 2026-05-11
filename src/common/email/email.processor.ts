import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { Job } from 'bullmq';
import { EmailJobData } from './email.type';

@Processor('email-queue')
export class EmailProcessor extends WorkerHost {
  constructor(private readonly emailService: EmailService) {
    super();
  }

  async process(job: Job<EmailJobData>) {
    const { email, otp } = job.data;
    //just started processing the job
    console.log({
      event: 'email_job_started',
      jobId: job.id,
      jobName: job.name,
      data: job.data,
    });

    try {
      /// send the email
      await this.emailService.accountVerification(email, otp);

      console.log({
        event: 'email_job_completed',
        jobId: job.id,
      });
    } catch (err) {
      console.log({
        event: 'email_job_failed',
        jobId: job.id,
        error: err.message,
      });
      throw err;
    }
  }
}
