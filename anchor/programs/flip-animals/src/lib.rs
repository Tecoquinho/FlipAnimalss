use anchor_lang::prelude::*;
use anchor_lang::solana_program::system_instruction;

declare_id!("Animals11111111111111111111111111111111111");

#[program]
pub mod flip_animals {
    use super::*;

    pub fn initialize_pot(ctx: Context<InitializePot>, room_id: String) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        pot.room_id = room_id;
        pot.total_amount = 0;
        pot.is_active = true;
        pot.bets = Vec::new();
        pot.admin = *ctx.accounts.admin.key;
        Ok(())
    }

    pub fn place_bet(ctx: Context<PlaceBet>, animal_id: u8, amount: u64) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        let player = &ctx.accounts.player;

        // Transfer SOL to the Pot PDA
        let ix = system_instruction::transfer(
            &player.key(),
            &pot.key(),
            amount,
        );
        anchor_lang::solana_program::program::invoke(
            &ix,
            &[
                player.to_account_info(),
                pot.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
            ],
        )?;

        pot.total_amount += amount;
        pot.bets.push(Bet {
            player: player.key(),
            amount,
            animal_id,
        });

        Ok(())
    }

    pub fn resolve_pot(ctx: Context<ResolvePot>, winner_animal_id: u8) -> Result<()> {
        let pot = &mut ctx.accounts.pot;
        
        // Find all winners who bet on the winning animal
        let mut total_winning_bets = 0;
        let mut winners = Vec::new();

        for bet in &pot.bets {
            if bet.animal_id == winner_animal_id {
                total_winning_bets += bet.amount;
                winners.push(bet.clone());
            }
        }

        if winners.is_empty() {
            return Err(ErrorCode::NoWinners.into());
        }

        let total_amount = pot.total_amount;
        
        // Calculate 4% House Fee (400 basis points)
        let house_fee = (total_amount as u128 * 400 / 10000) as u64;
        let net_prize = total_amount - house_fee;

        // 1. Transfer House Fee to Admin
        **pot.to_account_info().try_borrow_mut_lamports()? -= house_fee;
        **ctx.accounts.admin.to_account_info().try_borrow_mut_lamports()? += house_fee;

        // 2. Distribute net prize proportionally to winners
        for winner_bet in winners {
            let share = (winner_bet.amount as u128 * net_prize as u128 / total_winning_bets as u128) as u64;
            
            **pot.to_account_info().try_borrow_mut_lamports()? -= share;
            **ctx.accounts.winner_account.try_borrow_mut_lamports()? += share;
        }

        // Reset pot for next round
        pot.total_amount = 0;
        pot.bets.clear();

        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(room_id: String)]
pub struct InitializePot<'info> {
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 8 + 1 + 32 + (4 + (32 + 8 + 1) * 50), // Space for 50 bets
        seeds = [b"pot", room_id.as_bytes()],
        bump
    )]
    pub pot: Account<'info, Pot>,
    #[account(mut)]
    pub admin: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PlaceBet<'info> {
    #[account(mut)]
    pub pot: Account<'info, Pot>,
    #[account(mut)]
    pub player: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ResolvePot<'info> {
    #[account(mut, has_one = admin)]
    pub pot: Account<'info, Pot>,
    pub admin: Signer<'info>,
    /// CHECK: This is the account that will receive the funds (simplified for demo)
    #[account(mut)]
    pub winner_account: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct Pot {
    pub room_id: String,
    pub admin: Pubkey,
    pub total_amount: u64,
    pub is_active: bool,
    pub bets: Vec<Bet>,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct Bet {
    pub player: Pubkey,
    pub amount: u64,
    pub animal_id: u8,
}

#[error_code]
pub enum ErrorCode {
    #[msg("No winners found for the selected animal.")]
    NoWinners,
}
