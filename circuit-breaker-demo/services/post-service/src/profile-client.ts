import axios from "axios";

export type Profile = {
  id: number;
  name: string;
  bio: string;
};

export class ProfileClient {
  constructor(
    private readonly baseUrl: string,
    private readonly timeoutMs = 2000
  ) {}

  async getProfile(userId: string): Promise<Profile> {
    const response = await axios.get<Profile>(
      `${this.baseUrl}/profiles/${userId}`,
      { timeout: this.timeoutMs }
    );

    return response.data;
  }
}
