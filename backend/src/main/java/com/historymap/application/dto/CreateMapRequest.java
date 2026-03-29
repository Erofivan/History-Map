package com.historymap.application.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreateMapRequest {
    @NotBlank
    @Size(max = 200)
    private String name;
}
